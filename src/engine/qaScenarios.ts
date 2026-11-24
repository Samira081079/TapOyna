import {
  CheckinStatus,
  Language,
  MatchStatus,
  PaymentStatus,
  SeatStatus,
  SimulatorState,
  SlotStatus,
} from '../types/tapoyna';
import {
  SIM_USERS,
  advanceClockTo,
  attemptVenueExternalBlock,
  cancelMatchWithFullRefunds,
  cancelSeatParticipation,
  createInitialState,
  createSeatHold,
  getMatchPaidSeats,
  joinWaitlist,
  performQrCheckin,
  processPaymentWebhook,
  respondTopUpConsent,
  simulateConcurrentLastSeatRace,
} from './simulator';

export interface QaScenarioDefinition {
  id: string;
  title: Record<Language, string>;
  expected: Record<Language, string>;
  run: (basePolicy: SimulatorState['policy']) => SimulatorState;
}

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function seedPaidPlayers(
  state: SimulatorState,
  slotId: string,
  count: number,
): SimulatorState {
  let s = state;
  for (let i = 0; i < count; i++) {
    const user = SIM_USERS[i % SIM_USERS.length];
    s = createSeatHold(s, {
      slotId,
      userId: user.id,
      quantity: 1,
      idempotencyKey: `qa-seed-${slotId}-${i}-${user.id}`,
    });
    const pay = s.payments[0];
    s = processPaymentWebhook(s, {
      paymentId: pay.id,
      outcome: 'SUCCEEDED',
      providerEventId: `qa-evt-${slotId}-${i}`,
    });
  }
  return s;
}

export const QA_SCENARIOS: QaScenarioDefinition[] = [
  {
    id: 'AT-01',
    title: {
      ru: 'Активация FREE-слота и откат при сбое оплаты',
      az: 'FREE slotun aktivasiyası və ödəniş xətasında geri dönüş',
      en: 'Activate FREE slot & rollback on payment failure',
    },
    expected: {
      ru: 'Успешная оплата → OPEN (1/10); отказ webhook → слот возвращается в FREE',
      az: 'Uğurlu ödəniş → OPEN (1/10); imtina → slot FREE vəziyyətinə qayıdır',
      en: 'Payment SUCCEEDED → OPEN (1/10); FAILED webhook → slot returns to FREE',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      // First fail a hold to verify rollback to FREE
      s = createSeatHold(s, { slotId, userId: 'u1', quantity: 1, idempotencyKey: 'at01-fail' });
      const failPay = s.payments[0];
      s = processPaymentWebhook(s, { paymentId: failPay.id, outcome: 'FAILED' });
      const rolledBackToFree = s.slots.find((x) => x.id === slotId)?.status === SlotStatus.FREE;

      // Now succeed
      s = createSeatHold(s, { slotId, userId: 'u1', quantity: 1, idempotencyKey: 'at01-ok' });
      const okPay = s.payments[0];
      s = processPaymentWebhook(s, { paymentId: okPay.id, outcome: 'SUCCEEDED' });
      const match = s.matches[slotId];
      const passed =
        rolledBackToFree &&
        match?.status === MatchStatus.OPEN &&
        getMatchPaidSeats(match).length === 1;

      return {
        ...s,
        activeQaTestId: 'AT-01',
        qaAssertionResult: {
          testId: 'AT-01',
          passed,
          message: passed
            ? 'Rollback on FAILED → FREE verified, then SUCCEEDED → OPEN (1/10).'
            : 'Assertion failed for AT-01.',
        },
      };
    },
  },
  {
    id: 'AT-02',
    title: {
      ru: 'Гонка двух запросов за 10-е место',
      az: '10-cu yer üçün iki paralel sorğunun yarışı',
      en: 'Concurrent race for the 10th seat',
    },
    expected: {
      ru: 'Ровно 1 запись PAID (10/10); состояние 11/10 невозможно; второй игрок в Waitlist',
      az: 'Yalnız 1 PAID (10/10); 11/10 mümkün deyil; ikinci oyunçu Waitlist-ə düşür',
      en: 'Exactly 1 PAID (10/10); 11/10 impossible; second requester routed to Waitlist',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 9);
      s = simulateConcurrentLastSeatRace(s, slotId);
      const match = s.matches[slotId];
      const paid = match ? getMatchPaidSeats(match).length : 0;
      const passed = Boolean(match && paid === 10 && match.waitlist.length === 1);
      return {
        ...s,
        activeQaTestId: 'AT-02',
        qaAssertionResult: {
          testId: 'AT-02',
          passed,
          message: passed
            ? 'Row lock kept capacity at 10/10; competing request routed to Waitlist.'
            : 'Capacity invariant violated.',
        },
      };
    },
  },
  {
    id: 'AT-03',
    title: {
      ru: '10/10 оплачено к рубежу T–4ч',
      az: 'T–4s həddinə 10/10 ödəniş',
      en: '10/10 seats paid at T–4h cutoff',
    },
    expected: {
      ru: 'Матч переходит в CONFIRMED, слот в HARD_RESERVED, чат и QR открыты',
      az: 'Oyun CONFIRMED, slot HARD_RESERVED olur, çat və QR açılır',
      en: 'Match transitions to CONFIRMED, slot to HARD_RESERVED, QR & chat unlocked',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 10);
      const slot = s.slots.find((x) => x.id === slotId)!;
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS);
      const match = s.matches[slotId];
      const updatedSlot = s.slots.find((x) => x.id === slotId);
      const passed =
        match?.status === MatchStatus.CONFIRMED && updatedSlot?.status === SlotStatus.HARD_RESERVED;
      return {
        ...s,
        activeQaTestId: 'AT-03',
        qaAssertionResult: {
          testId: 'AT-03',
          passed,
          message: passed
            ? '10/10 confirmed at T–4h → CONFIRMED + HARD_RESERVED.'
            : 'Expected CONFIRMED + HARD_RESERVED.',
        },
      };
    },
  },
  {
    id: 'AT-04',
    title: {
      ru: '8/10 оплачено + все согласны на доплату 2.50 AZN',
      az: '8/10 ödənilib + hamı 2.50 AZN əlavə ödənişə razıdır',
      en: '8/10 paid + all consent to 2.50 AZN top-up',
    },
    expected: {
      ru: 'В T–4ч добирается 20 AZN, итог 100 AZN, статус CONFIRMED',
      az: 'T–4s-da 20 AZN tutulur, cəm 100 AZN olur, status CONFIRMED',
      en: 'Charges 20 AZN top-up at T–4h, totals 100 AZN, status CONFIRMED',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 8);
      const slot = s.slots.find((x) => x.id === slotId)!;
      // Move to T-6h so consents are prompted
      s = advanceClockTo(s, slot.startAtUtcMs - policy.topUpOfferHours * HOUR_MS);
      const match = s.matches[slotId]!;
      for (const c of match.topUpConsents) {
        s = respondTopUpConsent(s, { slotId, payerId: c.payerId, decision: 'ACCEPTED' });
      }
      // Move to T-4h cutoff
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS);
      const finalMatch = s.matches[slotId]!;
      const totalCollected = getMatchPaidSeats(finalMatch).reduce(
        (acc, seat) => acc + seat.paidBaseMinor + seat.paidTopUpMinor,
        0,
      );
      const passed = finalMatch.status === MatchStatus.CONFIRMED && totalCollected === 10000;
      return {
        ...s,
        activeQaTestId: 'AT-04',
        qaAssertionResult: {
          testId: 'AT-04',
          passed,
          message: passed
            ? '8×10.00 + 8×2.50 = 100.00 AZN collected → CONFIRMED.'
            : `Got ${totalCollected} qepik and status ${finalMatch.status}.`,
        },
      };
    },
  },
  {
    id: 'AT-05',
    title: {
      ru: '8/10 оплачено, но 1 игрок отказался от доплаты',
      az: '8/10 ödənilib, lakin 1 oyunçu əlavə ödənişdən imtina edib',
      en: '8/10 paid, 1 player declines top-up',
    },
    expected: {
      ru: 'Запрет списания без согласия → CANCELLED_UNDERFILLED и 100% возврат всем',
      az: 'Razılıqsız silmə qadağandır → CANCELLED_UNDERFILLED və hamıya 100% geri ödəniş',
      en: 'No unauthorized charge → CANCELLED_UNDERFILLED & 100% refunds',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 8);
      const slot = s.slots.find((x) => x.id === slotId)!;
      s = advanceClockTo(s, slot.startAtUtcMs - policy.topUpOfferHours * HOUR_MS);
      const consents = s.matches[slotId]!.topUpConsents;
      consents.forEach((c, idx) => {
        s = respondTopUpConsent(s, {
          slotId,
          payerId: c.payerId,
          decision: idx === 0 ? 'DECLINED' : 'ACCEPTED',
        });
      });
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS);
      const finalMatch = s.matches[slotId]!;
      const allRefunded = s.payments
        .filter((p) => p.matchId === finalMatch.id)
        .every((p) => p.status === PaymentStatus.REFUNDED);
      const passed = finalMatch.status === MatchStatus.CANCELLED_UNDERFILLED && allRefunded;
      return {
        ...s,
        activeQaTestId: 'AT-05',
        qaAssertionResult: {
          testId: 'AT-05',
          passed,
          message: passed
            ? 'Declined consent blocked confirmation → CANCELLED_UNDERFILLED + 100% refunds.'
            : 'Expected CANCELLED_UNDERFILLED with full refunds.',
        },
      };
    },
  },
  {
    id: 'AT-06',
    title: {
      ru: '7/10 оплачено к рубежу T–4ч (ниже порога 8)',
      az: 'T–4s həddində 7/10 ödəniş (min. 8 həddindən aşağı)',
      en: '7/10 paid at T–4h (below min threshold of 8)',
    },
    expected: {
      ru: 'Автоотмена, возврат средств игрокам, слот снова FREE, выплата площадке не создаётся',
      az: 'Avtomatik ləğv, tam geri ödəniş, slot FREE olur, meydançaya ödəniş yaradılmır',
      en: 'Auto-cancel, 100% refunds, slot returns to FREE, zero venue payout',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 7);
      const slot = s.slots.find((x) => x.id === slotId)!;
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS);
      const finalMatch = s.matches[slotId]!;
      const finalSlot = s.slots.find((x) => x.id === slotId)!;
      const noPayout = !s.payouts.some((po) => po.matchId === finalMatch.id);
      const passed =
        finalMatch.status === MatchStatus.CANCELLED_UNDERFILLED &&
        finalSlot.status === SlotStatus.FREE &&
        noPayout;
      return {
        ...s,
        activeQaTestId: 'AT-06',
        qaAssertionResult: {
          testId: 'AT-06',
          passed,
          message: passed
            ? '7/10 < 8 min → CANCELLED_UNDERFILLED, Slot → FREE, 0 payouts.'
            : 'Unexpected state for AT-06.',
        },
      };
    },
  },
  {
    id: 'AT-07',
    title: {
      ru: 'Отмена игроком до T–4ч и приглашение из Waitlist',
      az: 'T–4s-dan əvvəl ləğv və Waitlist-dən avtomatik dəvət',
      en: 'Player cancel before T–4h & Waitlist auto-offer',
    },
    expected: {
      ru: '100% возврат средств и автоприглашение 1-го участника Waitlist на 15 минут',
      az: '100% geri ödəniş və Waitlist-dəki 1-ci oyunçuya 15 dəqiqəlik təklif',
      en: '100% refund & automatic 15m offer to 1st Waitlist entry',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 10);
      s = joinWaitlist(s, slotId, 'u11');
      s = cancelSeatParticipation(s, { slotId, seatId: 10 });
      const match = s.matches[slotId]!;
      const offered = match.waitlist.find((w) => w.userId === 'u11' && w.status === 'OFFERED');
      const refund = s.payments.find(
        (p) => p.seatIds.includes(10) && p.status === PaymentStatus.REFUNDED,
      );
      const passed = Boolean(offered && refund);
      return {
        ...s,
        activeQaTestId: 'AT-07',
        qaAssertionResult: {
          testId: 'AT-07',
          passed,
          message: passed
            ? 'Seat #10 refunded 100%; Elnur Cəfərov (Waitlist #1) received 15m offer.'
            : 'Expected 100% refund + Waitlist OFFERED.',
        },
      };
    },
  },
  {
    id: 'AT-08',
    title: {
      ru: 'Поздняя отмена после T–4ч и замена до T–30м',
      az: 'T–4s sonrası ləğv və T–30d-yə qədər əvəzləmə',
      en: 'Post-T–4h cancellation & replacement before T–30m',
    },
    expected: {
      ru: 'Возврат прежнему игроку (минус сбор провайдера) без двойного зачёта аренды',
      az: 'Əvvəlki oyunçuya qaytarılma (ekvayrinq haqqı çıxılmaqla), ikiqat icarə olmadan',
      en: 'Original player refunded minus provider fee without double-charging rent',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 10);
      const slot = s.slots.find((x) => x.id === slotId)!;
      // Pass cutoff T-4h -> CONFIRMED
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS + 10 * MIN_MS);
      // Player 10 cancels after cutoff -> replacementOpen = true
      s = cancelSeatParticipation(s, { slotId, seatId: 10 });
      // New player u12 buys replacement seat before T-30m
      s = createSeatHold(s, { slotId, userId: 'u12', quantity: 1, idempotencyKey: 'at08-replace' });
      const repPay = s.payments[0];
      s = processPaymentWebhook(s, { paymentId: repPay.id, outcome: 'SUCCEEDED' });
      const match = s.matches[slotId]!;
      const oldRefunded = s.payments.some((p) => p.status === PaymentStatus.PARTIAL_REFUNDED);
      const paidSeats = getMatchPaidSeats(match).length;
      const passed = oldRefunded && paidSeats === 10;
      return {
        ...s,
        activeQaTestId: 'AT-08',
        qaAssertionResult: {
          testId: 'AT-08',
          passed,
          message: passed
            ? 'Replacement succeeded before T–30m; previous player partial-refunded, 10/10 rent intact.'
            : 'Expected partial refund on old player + 10/10.',
        },
      };
    },
  },
  {
    id: 'AT-09',
    title: {
      ru: 'Отмена площадкой после полной оплаты (CANCEL_BY_VENUE)',
      az: 'Tam ödənişdən sonra meydança tərəfindən ləğv',
      en: 'Venue cancellation after full payment',
    },
    expected: {
      ru: '100% возврат всем участникам, рейтинг игроков не снижается',
      az: 'Bütün iştirakçılara 100% geri ödəniş, oyunçu reytinqi azalmır',
      en: '100% refund to all participants; player reliability untouched',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 10);
      const slot = s.slots.find((x) => x.id === slotId)!;
      s = advanceClockTo(s, slot.startAtUtcMs - policy.cutoffHours * HOUR_MS);
      s = cancelMatchWithFullRefunds(
        s,
        slotId,
        MatchStatus.CANCELLED_VENUE,
        'Lighting power outage at pitch',
      );
      const match = s.matches[slotId]!;
      const allRefunded = s.payments
        .filter((p) => p.matchId === match.id)
        .every((p) => p.status === PaymentStatus.REFUNDED);
      const passed = match.status === MatchStatus.CANCELLED_VENUE && allRefunded;
      return {
        ...s,
        activeQaTestId: 'AT-09',
        qaAssertionResult: {
          testId: 'AT-09',
          passed,
          message: passed
            ? 'CANCELLED_VENUE executed; 10/10 payments REFUNDED 100%.'
            : 'Expected CANCELLED_VENUE + 100% refunds.',
        },
      };
    },
  },
  {
    id: 'AT-10',
    title: {
      ru: 'Дублированный webhook оплаты (идемпотентность)',
      az: 'Dublikat ödəniş webhook-u (idempotentlik)',
      en: 'Duplicate payment webhook idempotency',
    },
    expected: {
      ru: 'Создаётся ровно одна финансовая операция, повторный event_id игнорируется',
      az: 'Yalnız bir maliyyə əməliyyatı yaradılır, təkrar event_id rədd edilir',
      en: 'Exactly one financial record; duplicate provider_event_id ignored',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = createSeatHold(s, { slotId, userId: 'u1', quantity: 2, idempotencyKey: 'at10-hold' });
      const pay = s.payments[0];
      const evtId = 'evt-at10-unique';
      s = processPaymentWebhook(s, { paymentId: pay.id, outcome: 'SUCCEEDED', providerEventId: evtId });
      s = processPaymentWebhook(s, { paymentId: pay.id, outcome: 'SUCCEEDED', providerEventId: evtId });
      const match = s.matches[slotId]!;
      const paidSeats = getMatchPaidSeats(match).length;
      const dedupLogged = s.auditEvents.some((a) => a.action === 'WEBHOOK_DEDUPLICATED');
      const passed = paidSeats === 2 && dedupLogged;
      return {
        ...s,
        activeQaTestId: 'AT-10',
        qaAssertionResult: {
          testId: 'AT-10',
          passed,
          message: passed
            ? 'Duplicate webhook ignored via provider_event_id; exactly 2 seats paid once.'
            : 'Idempotency check failed.',
        },
      };
    },
  },
  {
    id: 'AT-11',
    title: {
      ru: 'Одноразовый QR-чек-ин на входе и защита от повторного скана',
      az: 'Birdəfəlik QR giriş və təkrar skandan qorunma',
      en: 'Single-use QR check-in & replay rejection',
    },
    expected: {
      ru: 'Первый скан → CHECKED_IN; повторный скан того же QR отклоняется',
      az: 'İlk skan → CHECKED_IN; eyni QR-ın təkrar skanı rədd edilir',
      en: '1st scan → CHECKED_IN; 2nd scan of same QR rejected',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-genclik-2000';
      s = { ...s, activeSlotId: slotId };
      s = seedPaidPlayers(s, slotId, 10);
      const slot = s.slots.find((x) => x.id === slotId)!;
      s = advanceClockTo(s, slot.startAtUtcMs + 5 * MIN_MS);
      s = performQrCheckin(s, { slotId, seatId: 1, method: 'QR_SCAN' });
      s = performQrCheckin(s, { slotId, seatId: 1, method: 'QR_SCAN' });
      const seat1 = s.matches[slotId]!.seats.find((x) => x.seatId === 1)!;
      const replayBlocked = s.auditEvents.some((a) => a.action === 'QR_DUPLICATE_REJECTED');
      const passed = seat1.checkinStatus === CheckinStatus.CHECKED_IN && replayBlocked;
      return {
        ...s,
        activeQaTestId: 'AT-11',
        qaAssertionResult: {
          testId: 'AT-11',
          passed,
          message: passed
            ? 'Seat #1 CHECKED_IN on first scan; duplicate QR scan blocked.'
            : 'QR single-use check failed.',
        },
      };
    },
  },
  {
    id: 'AT-12',
    title: {
      ru: 'Запрет закрытия SOFT_RESERVED под внешнего клиента без отмены',
      az: 'SOFT_RESERVED slotun ləğvsiz kənar müştəriyə bağlanmasının qadağası',
      en: 'Guardrail against blocking SOFT_RESERVED externally',
    },
    expected: {
      ru: 'Прямая блокировка запрещена; требуется CANCEL_BY_VENUE с возвратом игрокам',
      az: 'Birbaşa bağlama qadağandır; CANCEL_BY_VENUE və tam geri ödəniş tələb olunur',
      en: 'Silent external overwrite blocked; requires explicit CANCEL_BY_VENUE',
    },
    run: (policy) => {
      let s = createInitialState(policy);
      const slotId = 'slot-yasamal-2100'; // pre-seeded SOFT_RESERVED (8/10)
      s = { ...s, activeSlotId: slotId };
      s = attemptVenueExternalBlock(s, slotId);
      const slot = s.slots.find((x) => x.id === slotId)!;
      const blocked = s.auditEvents.some((a) => a.action === 'EXTERNAL_OVERWRITE_BLOCKED');
      const passed = slot.status === SlotStatus.SOFT_RESERVED && blocked;
      return {
        ...s,
        activeQaTestId: 'AT-12',
        qaAssertionResult: {
          testId: 'AT-12',
          passed,
          message: passed
            ? 'Silent external overwrite on SOFT_RESERVED (8/10) blocked by guardrail.'
            : 'Guardrail failed to protect SOFT_RESERVED.',
        },
      };
    },
  },
];
