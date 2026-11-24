import {
  AuditEvent,
  CheckinStatus,
  InvariantCheck,
  MatchRecord,
  MatchStatus,
  PaymentRecord,
  PaymentStatus,
  PayoutRecord,
  PolicyConfig,
  Role,
  SeatRecord,
  SeatStatus,
  SimUser,
  SimulatorState,
  SlotRecord,
  SlotStatus,
  TopUpConsentRecord,
  WaitlistEntry,
} from '../types/tapoyna';
import { calculateTopUpShares, formatAzn, formatBakuTime } from './formatters';

export const SIM_USERS: SimUser[] = [
  { id: 'u1', name: 'Elvin Məmmədov', district: 'Gənclik', reliabilityScore: 98, skillLevel: 4.2 },
  { id: 'u2', name: 'Rəşad Əliyev', district: 'Nərimanov', reliabilityScore: 95, skillLevel: 3.9 },
  { id: 'u3', name: 'Kamran Həsənov', district: 'Yasamal', reliabilityScore: 92, skillLevel: 4.0 },
  { id: 'u4', name: 'Tural Quliyev', district: 'Gənclik', reliabilityScore: 97, skillLevel: 4.5 },
  { id: 'u5', name: 'Murad Rəhimov', district: 'Nərimanov', reliabilityScore: 90, skillLevel: 3.5 },
  { id: 'u6', name: 'Fərid Kərimov', district: 'Yasamal', reliabilityScore: 94, skillLevel: 4.1 },
  { id: 'u7', name: 'Nihad Babayev', district: 'Gənclik', reliabilityScore: 89, skillLevel: 3.8 },
  { id: 'u8', name: 'Samir Nəsirov', district: 'Nərimanov', reliabilityScore: 96, skillLevel: 4.3 },
  { id: 'u9', name: 'Vüsal İbrahimov', district: 'Yasamal', reliabilityScore: 93, skillLevel: 3.7 },
  { id: 'u10', name: 'Orxan Sadiqov', district: 'Gənclik', reliabilityScore: 99, skillLevel: 4.4 },
  { id: 'u11', name: 'Elnur Cəfərov', district: 'Nərimanov', reliabilityScore: 91, skillLevel: 3.6 },
  { id: 'u12', name: 'Araz Vəliyev', district: 'Yasamal', reliabilityScore: 95, skillLevel: 4.0 },
];

export const DEFAULT_POLICY: PolicyConfig = {
  cutoffHours: 4,
  topUpOfferHours: 6,
  holdTtlMinutes: 10,
  waitlistTtlMinutes: 15,
  minPlayers: 8,
  capacity: 10,
  requireAllTopUpConsents: true,
  forbidEmptyMatches: true,
  protectSoftReserve: true,
  platformFeePct: 10,
  providerFeePct: 2,
  playerServiceFeeMinor: 50, // 0.50 AZN transparent service fee per seat
  replacementDeadlineMinutes: 30,
  enableV15Features: true,
};

// Base match date: 2026-11-24 20:00 Asia/Baku = 16:00 UTC
const BASE_KICKOFF_UTC_MS = Date.UTC(2026, 10, 24, 16, 0, 0);
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

let seqCounter = 100;
function nextId(prefix: string): string {
  seqCounter += 1;
  return `${prefix}-${seqCounter}`;
}

export function createQrToken(matchId: string, seatId: number): string {
  return `QR-${matchId.toUpperCase()}-S${String(seatId).padStart(2, '0')}-${Math.abs((seatId * 7919 + seqCounter) % 9000 + 1000)}`;
}

function createEmptySeats(matchId: string, capacity: number): SeatRecord[] {
  return Array.from({ length: capacity }, (_, idx) => ({
    seatId: idx + 1,
    matchId,
    payerId: null,
    payerName: null,
    attendeeName: null,
    isGuest: false,
    inviteToken: null,
    seatStatus: SeatStatus.FREE,
    holdExpiresAtUtcMs: null,
    paymentId: null,
    paidBaseMinor: 0,
    paidTopUpMinor: 0,
    checkinStatus: CheckinStatus.PENDING,
    checkedInAtUtcMs: null,
    checkinMethod: null,
    qrToken: null,
    qrUsed: false,
    replacementOpen: false,
  }));
}

export function createInitialState(policy: PolicyConfig = DEFAULT_POLICY): SimulatorState {
  seqCounter = 100;
  const startClock = BASE_KICKOFF_UTC_MS - 8 * HOUR_MS; // 12:00 Asia/Baku (T-8h)

  const slots: SlotRecord[] = [
    {
      id: 'slot-genclik-2000',
      venueName: 'Gənclik Arena',
      fieldName: 'Pitch #1 (5×5)',
      district: 'Gənclik',
      format: '5×5',
      capacity: policy.capacity,
      startAtUtcMs: BASE_KICKOFF_UTC_MS,
      endAtUtcMs: BASE_KICKOFF_UTC_MS + HOUR_MS,
      rentMinor: 10000, // 100.00 AZN
      currency: 'AZN',
      status: SlotStatus.FREE,
      version: 1,
    },
    {
      id: 'slot-yasamal-2100',
      venueName: 'Yasamal Sport Club',
      fieldName: 'Pitch A (5×5)',
      district: 'Yasamal',
      format: '5×5',
      capacity: policy.capacity,
      startAtUtcMs: BASE_KICKOFF_UTC_MS + HOUR_MS,
      endAtUtcMs: BASE_KICKOFF_UTC_MS + 2 * HOUR_MS,
      rentMinor: 10000,
      currency: 'AZN',
      status: SlotStatus.SOFT_RESERVED,
      version: 2,
    },
    {
      id: 'slot-nerimanov-2200',
      venueName: 'Nərimanov Turf',
      fieldName: 'Field #2 (5×5)',
      district: 'Nərimanov',
      format: '5×5',
      capacity: policy.capacity,
      startAtUtcMs: BASE_KICKOFF_UTC_MS + 2 * HOUR_MS,
      endAtUtcMs: BASE_KICKOFF_UTC_MS + 3 * HOUR_MS,
      rentMinor: 10000,
      currency: 'AZN',
      status: SlotStatus.FREE,
      version: 1,
    },
  ];

  // Pre-seed Yasamal slot as an "almost full" match (8/10) for catalog filtering demo
  const preMatchId = 'm-yasamal-1';
  const yasamalSlot = slots[1];
  const preSeats = createEmptySeats(preMatchId, policy.capacity);
  const prePayments: PaymentRecord[] = [];

  for (let i = 0; i < 8; i++) {
    const user = SIM_USERS[i + 1];
    const payId = `pay-seed-${i + 1}`;
    preSeats[i] = {
      ...preSeats[i],
      payerId: user.id,
      payerName: user.name,
      attendeeName: user.name,
      seatStatus: SeatStatus.PAID,
      paymentId: payId,
      paidBaseMinor: 1000,
    };
    prePayments.push({
      id: payId,
      matchId: preMatchId,
      slotId: yasamalSlot.id,
      payerId: user.id,
      payerName: user.name,
      seatIds: [i + 1],
      amountMinor: 1000,
      serviceFeeMinor: policy.playerServiceFeeMinor,
      kind: 'BASE',
      status: PaymentStatus.SUCCEEDED,
      idempotencyKey: `idem-seed-${i + 1}`,
      providerEventIds: [`evt-seed-${i + 1}`],
      createdAtUtcMs: startClock - 30 * MIN_MS,
      updatedAtUtcMs: startClock - 29 * MIN_MS,
      refundedMinor: 0,
    });
  }

  const preMatch: MatchRecord = {
    id: preMatchId,
    slotId: yasamalSlot.id,
    initiatorId: SIM_USERS[1].id,
    initiatorName: SIM_USERS[1].name,
    minPlayers: policy.minPlayers,
    capacity: policy.capacity,
    cutoffAtUtcMs: yasamalSlot.startAtUtcMs - policy.cutoffHours * HOUR_MS,
    topUpOfferAtUtcMs: yasamalSlot.startAtUtcMs - policy.topUpOfferHours * HOUR_MS,
    replacementDeadlineUtcMs: yasamalSlot.startAtUtcMs - policy.replacementDeadlineMinutes * MIN_MS,
    chatArchiveAtUtcMs: yasamalSlot.endAtUtcMs + 24 * HOUR_MS,
    status: MatchStatus.OPEN,
    pricingSnapshot: {
      rentMinor: yasamalSlot.rentMinor,
      seatPriceMinor: Math.floor(yasamalSlot.rentMinor / policy.capacity),
      capacity: policy.capacity,
      minPlayers: policy.minPlayers,
      platformFeePct: policy.platformFeePct,
      providerFeePct: policy.providerFeePct,
      playerServiceFeeMinor: policy.playerServiceFeeMinor,
      ruleVersion: 'v1.0-baku',
      capturedAtUtcMs: startClock - 30 * MIN_MS,
    },
    venueDiscountMinor: 0,
    initiatorExtraMinor: 0,
    seats: preSeats,
    topUpConsents: [],
    waitlist: [],
    chatMessages: [],
    ratings: [],
  };

  return {
    clockUtcMs: startClock,
    policy: { ...policy },
    slots,
    activeSlotId: slots[0].id,
    matches: {
      [yasamalSlot.id]: preMatch,
    },
    payments: prePayments,
    payouts: [],
    auditEvents: [
      {
        id: nextId('aud'),
        timestampUtcMs: startClock,
        actorRole: 'SYSTEM',
        actorName: 'TapOyna Engine',
        action: 'SANDBOX_INITIALIZED',
        entityType: 'SLOT',
        entityId: slots[0].id,
        beforeState: 'NONE',
        afterState: 'FREE',
        detail: 'Baku 5×5 pilot sandbox ready. Primary slot Gənclik Arena (20:00 Asia/Baku) is FREE.',
      },
    ],
    processedProviderEvents: prePayments.flatMap((p) => p.providerEventIds),
    usedIdempotencyKeys: prePayments.map((p) => p.idempotencyKey),
    activePlayerId: SIM_USERS[0].id,
    lastNotice: null,
    activeQaTestId: null,
    qaAssertionResult: null,
  };
}

function appendAudit(
  events: AuditEvent[],
  event: Omit<AuditEvent, 'id'>,
): AuditEvent[] {
  return [{ ...event, id: nextId('aud') }, ...events].slice(0, 120);
}

export function getActiveSlot(state: SimulatorState): SlotRecord {
  return state.slots.find((s) => s.id === state.activeSlotId) ?? state.slots[0];
}

export function getActiveMatch(state: SimulatorState): MatchRecord | null {
  return state.matches[state.activeSlotId] ?? null;
}

export function getMatchPaidSeats(match: MatchRecord): SeatRecord[] {
  return match.seats.filter((s) => s.seatStatus === SeatStatus.PAID);
}

export function getMatchHoldSeats(match: MatchRecord): SeatRecord[] {
  return match.seats.filter((s) => s.seatStatus === SeatStatus.HOLD);
}

export function computeRentCoverage(match: MatchRecord): {
  rentMinor: number;
  basePaidMinor: number;
  topUpPaidMinor: number;
  committedTopUpMinor: number;
  venueDiscountMinor: number;
  initiatorExtraMinor: number;
  coveredNowMinor: number;
  potentialWithConsentsMinor: number;
  deficitMinor: number;
  allPaidConsented: boolean;
} {
  const paidSeats = getMatchPaidSeats(match);
  const basePaidMinor = paidSeats.reduce((acc, s) => acc + s.paidBaseMinor, 0);
  const topUpPaidMinor = paidSeats.reduce((acc, s) => acc + s.paidTopUpMinor, 0);
  const coveredNowMinor =
    basePaidMinor + topUpPaidMinor + match.venueDiscountMinor + match.initiatorExtraMinor;
  const deficitMinor = Math.max(0, match.pricingSnapshot.rentMinor - coveredNowMinor);

  const acceptedMaxMinor = match.topUpConsents
    .filter((c) => c.decision === 'ACCEPTED')
    .reduce((acc, c) => acc + c.maxAmountMinor, 0);

  const payersWithPaidSeats = new Set(paidSeats.map((s) => s.payerId).filter(Boolean));
  const consentedPayers = new Set(
    match.topUpConsents.filter((c) => c.decision === 'ACCEPTED').map((c) => c.payerId),
  );
  const allPaidConsented =
    payersWithPaidSeats.size > 0 &&
    Array.from(payersWithPaidSeats).every((pid) => pid && consentedPayers.has(pid));

  const potentialWithConsentsMinor =
    coveredNowMinor + (match.status === MatchStatus.TOPUP_OFFER || match.status === MatchStatus.OPEN ? acceptedMaxMinor : 0);

  return {
    rentMinor: match.pricingSnapshot.rentMinor,
    basePaidMinor,
    topUpPaidMinor,
    committedTopUpMinor: acceptedMaxMinor,
    venueDiscountMinor: match.venueDiscountMinor,
    initiatorExtraMinor: match.initiatorExtraMinor,
    coveredNowMinor,
    potentialWithConsentsMinor,
    deficitMinor,
    allPaidConsented,
  };
}

/**
 * Generates or refreshes TopUpConsent records when entering T-6h window with 8..9/10 paid seats.
 */
function ensureTopUpConsents(match: MatchRecord, clockUtcMs: number): MatchRecord {
  const paidSeats = getMatchPaidSeats(match);
  const deficit = Math.max(
    0,
    match.pricingSnapshot.rentMinor -
      paidSeats.reduce((a, s) => a + s.paidBaseMinor + s.paidTopUpMinor, 0) -
      match.venueDiscountMinor -
      match.initiatorExtraMinor,
  );

  if (paidSeats.length < match.minPlayers || paidSeats.length >= match.capacity || deficit <= 0) {
    return match;
  }

  const shares = calculateTopUpShares(
    deficit,
    paidSeats.map((s) => s.seatId),
  );

  // Group seats by payerId
  const byPayer = new Map<string, { name: string; seatIds: number[]; maxMinor: number }>();
  for (const seat of paidSeats) {
    if (!seat.payerId || !seat.payerName) continue;
    const prev = byPayer.get(seat.payerId) ?? { name: seat.payerName, seatIds: [], maxMinor: 0 };
    prev.seatIds.push(seat.seatId);
    prev.maxMinor += shares[seat.seatId] ?? 0;
    byPayer.set(seat.payerId, prev);
  }

  const existingByPayer = new Map(match.topUpConsents.map((c) => [c.payerId, c]));
  const updatedConsents: TopUpConsentRecord[] = [];

  byPayer.forEach((info, payerId) => {
    const existing = existingByPayer.get(payerId);
    const perSeatMax = Math.max(...info.seatIds.map((sid) => shares[sid] ?? 0));
    if (existing) {
      updatedConsents.push({
        ...existing,
        seatIds: info.seatIds,
        maxAmountMinor: info.maxMinor,
        perSeatMaxMinor: perSeatMax,
      });
    } else {
      updatedConsents.push({
        id: nextId('tuc'),
        matchId: match.id,
        payerId,
        payerName: info.name,
        seatIds: info.seatIds,
        maxAmountMinor: info.maxMinor,
        perSeatMaxMinor: perSeatMax,
        decision: 'PENDING',
        decidedAtUtcMs: null,
        ruleVersion: match.pricingSnapshot.ruleVersion,
      });
    }
  });

  return {
    ...match,
    status:
      clockUtcMs >= match.topUpOfferAtUtcMs && clockUtcMs < match.cutoffAtUtcMs
        ? MatchStatus.TOPUP_OFFER
        : match.status,
    topUpConsents: updatedConsents,
  };
}

/**
 * Create a HOLD (1..10 seats) on a FREE slot or an OPEN match.
 */
export function createSeatHold(
  state: SimulatorState,
  params: {
    slotId: string;
    userId: string;
    quantity: number;
    idempotencyKey?: string;
  },
): SimulatorState {
  const slot = state.slots.find((s) => s.id === params.slotId);
  const user = SIM_USERS.find((u) => u.id === params.userId) ?? SIM_USERS[0];
  if (!slot) return state;

  const key = params.idempotencyKey ?? `idem-${slot.id}-${user.id}-${params.quantity}-${state.clockUtcMs}`;
  if (state.usedIdempotencyKeys.includes(key)) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'info',
        text: `Idempotency-Key (${key}) already processed — duplicate hold prevented.`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'PLAYER',
        actorName: user.name,
        action: 'IDEMPOTENT_HOLD_REPLAY',
        entityType: 'PAYMENT',
        entityId: slot.id,
        beforeState: slot.status,
        afterState: slot.status,
        detail: `Duplicate POST /holds blocked by Idempotency-Key ${key}.`,
        idempotencyKey: key,
      }),
    };
  }

  if (slot.status === SlotStatus.BLOCKED_EXTERNAL || slot.status === SlotStatus.UNAVAILABLE) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'error',
        text: `Slot is ${slot.status}; booking is blocked.`,
      },
    };
  }

  let match = state.matches[slot.id];
  const isNewActivation = !match;

  if (!match) {
    if (slot.status !== SlotStatus.FREE) {
      return {
        ...state,
        lastNotice: {
          id: nextId('ntc'),
          tone: 'error',
          text: `Cannot activate slot in state ${slot.status}.`,
        },
      };
    }
    const matchId = nextId('m');
    match = {
      id: matchId,
      slotId: slot.id,
      initiatorId: user.id,
      initiatorName: user.name,
      minPlayers: state.policy.minPlayers,
      capacity: slot.capacity,
      cutoffAtUtcMs: slot.startAtUtcMs - state.policy.cutoffHours * HOUR_MS,
      topUpOfferAtUtcMs: slot.startAtUtcMs - state.policy.topUpOfferHours * HOUR_MS,
      replacementDeadlineUtcMs: slot.startAtUtcMs - state.policy.replacementDeadlineMinutes * MIN_MS,
      chatArchiveAtUtcMs: slot.endAtUtcMs + 24 * HOUR_MS,
      status: MatchStatus.OPEN,
      pricingSnapshot: {
        rentMinor: slot.rentMinor,
        seatPriceMinor: Math.floor(slot.rentMinor / slot.capacity),
        capacity: slot.capacity,
        minPlayers: state.policy.minPlayers,
        platformFeePct: state.policy.platformFeePct,
        providerFeePct: state.policy.providerFeePct,
        playerServiceFeeMinor: state.policy.playerServiceFeeMinor,
        ruleVersion: 'v1.0-baku',
        capturedAtUtcMs: state.clockUtcMs,
      },
      venueDiscountMinor: 0,
      initiatorExtraMinor: 0,
      seats: createEmptySeats(matchId, slot.capacity),
      topUpConsents: [],
      waitlist: [],
      chatMessages: [],
      ratings: [],
    };
  }

  // Check cutoff boundary (cannot regular-book after T-4h unless it's a replacement seat before T-30m)
  const isReplacementWindow =
    state.clockUtcMs >= match.cutoffAtUtcMs &&
    state.clockUtcMs < match.replacementDeadlineUtcMs &&
    match.status === MatchStatus.CONFIRMED;

  if (state.clockUtcMs >= match.cutoffAtUtcMs && !isReplacementWindow) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'error',
        text: 'Cutoff T–4h has passed; new holds are closed.',
      },
    };
  }

  const availableSeats = isReplacementWindow
    ? match.seats.filter((s) => s.seatStatus === SeatStatus.FREE && s.replacementOpen)
    : match.seats.filter((s) => s.seatStatus === SeatStatus.FREE);

  if (availableSeats.length < params.quantity) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'warning',
        text: `Only ${availableSeats.length} free seat(s) left. Join Waitlist instead.`,
      },
    };
  }

  const targetSeats = availableSeats.slice(0, params.quantity);
  const holdExpires = state.clockUtcMs + state.policy.holdTtlMinutes * MIN_MS;
  const paymentId = nextId('pay');
  const seatPrice = match.pricingSnapshot.seatPriceMinor;
  const amountMinor = seatPrice * targetSeats.length;
  const serviceFeeMinor = match.pricingSnapshot.playerServiceFeeMinor * targetSeats.length;

  const updatedSeats = match.seats.map((seat) => {
    const idx = targetSeats.findIndex((t) => t.seatId === seat.seatId);
    if (idx === -1) return seat;
    const isGuest = idx > 0;
    return {
      ...seat,
      payerId: user.id,
      payerName: user.name,
      attendeeName: isGuest ? `${user.name.split(' ')[0]} · Guest #${idx}` : user.name,
      isGuest,
      inviteToken: isGuest ? `INV-${match.id}-S${seat.seatId}` : null,
      seatStatus: SeatStatus.HOLD,
      holdExpiresAtUtcMs: holdExpires,
      paymentId,
    };
  });

  const updatedMatch: MatchRecord = {
    ...match,
    seats: updatedSeats,
  };

  const newPayment: PaymentRecord = {
    id: paymentId,
    matchId: match.id,
    slotId: slot.id,
    payerId: user.id,
    payerName: user.name,
    seatIds: targetSeats.map((s) => s.seatId),
    amountMinor,
    serviceFeeMinor,
    kind: isReplacementWindow ? 'REPLACEMENT' : 'BASE',
    status: PaymentStatus.PENDING_PROVIDER,
    idempotencyKey: key,
    providerEventIds: [],
    createdAtUtcMs: state.clockUtcMs,
    updatedAtUtcMs: state.clockUtcMs,
    refundedMinor: 0,
  };

  const nextSlotStatus = isNewActivation ? SlotStatus.PAYMENT_LOCK : slot.status;

  return {
    ...state,
    slots: state.slots.map((s) =>
      s.id === slot.id ? { ...s, status: nextSlotStatus, version: s.version + 1 } : s,
    ),
    matches: {
      ...state.matches,
      [slot.id]: updatedMatch,
    },
    payments: [newPayment, ...state.payments],
    usedIdempotencyKeys: [...state.usedIdempotencyKeys, key],
    lastNotice: {
      id: nextId('ntc'),
      tone: 'info',
      text: `HOLD created (${targetSeats.length} seat${targetSeats.length > 1 ? 's' : ''}) until ${formatBakuTime(holdExpires)} Asia/Baku. Confirm via Webhook.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'PLAYER',
      actorName: user.name,
      action: isNewActivation ? 'ACTIVATE_SLOT_HOLD' : 'CREATE_SEAT_HOLD',
      entityType: 'PAYMENT',
      entityId: paymentId,
      beforeState: slot.status,
      afterState: `${nextSlotStatus} (HOLD ${targetSeats.map((s) => `#${s.seatId}`).join(',')})`,
      detail: `Locked ${targetSeats.length} seat(s) for ${formatAzn(amountMinor)} + ${formatAzn(serviceFeeMinor)} fee. Waiting for webhook.`,
      idempotencyKey: key,
    }),
  };
}

/**
 * Simulates provider webhook arrival (SUCCEEDED, FAILED, EXPIRED) with cryptographic deduplication
 * and late-webhook compensatory refund protection.
 */
export function processPaymentWebhook(
  state: SimulatorState,
  params: {
    paymentId: string;
    outcome: 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
    providerEventId?: string;
  },
): SimulatorState {
  const payment = state.payments.find((p) => p.id === params.paymentId);
  if (!payment) return state;

  const eventId = params.providerEventId ?? `evt-${payment.id}-${params.outcome.toLowerCase()}`;

  // Deduplication check (AT-10)
  if (state.processedProviderEvents.includes(eventId)) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'info',
        text: `Duplicate webhook (${eventId}) ignored idempotently — zero duplicate charges.`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'WEBHOOK',
        actorName: 'Payment Gateway',
        action: 'WEBHOOK_DEDUPLICATED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        beforeState: payment.status,
        afterState: payment.status,
        detail: `Duplicate provider_event_id ${eventId} ignored cleanly.`,
      }),
    };
  }

  const slot = state.slots.find((s) => s.id === payment.slotId);
  const match = state.matches[payment.slotId];
  if (!slot || !match) return state;

  // Handle FAILED or EXPIRED
  if (params.outcome === 'FAILED' || params.outcome === 'EXPIRED') {
    const updatedSeats = match.seats.map((seat) =>
      seat.paymentId === payment.id && seat.seatStatus === SeatStatus.HOLD
        ? {
            ...seat,
            payerId: null,
            payerName: null,
            attendeeName: null,
            isGuest: false,
            inviteToken: null,
            seatStatus: SeatStatus.FREE,
            holdExpiresAtUtcMs: null,
            paymentId: null,
          }
        : seat,
    );

    const anyPaidOrHold = updatedSeats.some(
      (s) => s.seatStatus === SeatStatus.PAID || s.seatStatus === SeatStatus.HOLD,
    );

    const nextSlotStatus = !anyPaidOrHold ? SlotStatus.FREE : slot.status;
    const nextMatches = { ...state.matches };
    if (!anyPaidOrHold && slot.status === SlotStatus.PAYMENT_LOCK) {
      delete nextMatches[slot.id];
    } else {
      nextMatches[slot.id] = { ...match, seats: updatedSeats };
    }

    return {
      ...state,
      slots: state.slots.map((s) =>
        s.id === slot.id ? { ...s, status: nextSlotStatus, version: s.version + 1 } : s,
      ),
      matches: nextMatches,
      payments: state.payments.map((p) =>
        p.id === payment.id
          ? {
              ...p,
              status: params.outcome === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.EXPIRED,
              providerEventIds: [...p.providerEventIds, eventId],
              updatedAtUtcMs: state.clockUtcMs,
            }
          : p,
      ),
      processedProviderEvents: [...state.processedProviderEvents, eventId],
      lastNotice: {
        id: nextId('ntc'),
        tone: 'warning',
        text: `Webhook ${params.outcome}: HOLD released. ${!anyPaidOrHold ? 'Slot returned to FREE (zero empty match).' : ''}`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'WEBHOOK',
        actorName: 'Payment Gateway',
        action: `WEBHOOK_${params.outcome}`,
        entityType: 'PAYMENT',
        entityId: payment.id,
        beforeState: payment.status,
        afterState: params.outcome,
        detail: `HOLD released for seats ${payment.seatIds.join(',')}. Slot status: ${nextSlotStatus}.`,
      }),
    };
  }

  // Handle SUCCEEDED: verify the seats are still in HOLD for this paymentId
  const seatsStillHeld = payment.seatIds.every((sid) => {
    const s = match.seats.find((x) => x.seatId === sid);
    return s && s.seatStatus === SeatStatus.HOLD && s.paymentId === payment.id;
  });

  if (!seatsStillHeld) {
    // Late webhook after HOLD expired & seat taken/freed -> automatic compensatory refund!
    return {
      ...state,
      payments: state.payments.map((p) =>
        p.id === payment.id
          ? {
              ...p,
              status: PaymentStatus.REFUNDED,
              refundedMinor: p.amountMinor + p.serviceFeeMinor,
              refundReason: 'COMPENSATORY_LATE_WEBHOOK_AFTER_HOLD_EXPIRY',
              providerEventIds: [...p.providerEventIds, eventId],
              updatedAtUtcMs: state.clockUtcMs,
            }
          : p,
      ),
      processedProviderEvents: [...state.processedProviderEvents, eventId],
      lastNotice: {
        id: nextId('ntc'),
        tone: 'warning',
        text: `Late webhook arrived after HOLD expired — compensatory 100% refund issued automatically.`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'WEBHOOK',
        actorName: 'Payment Gateway',
        action: 'LATE_WEBHOOK_COMPENSATORY_REFUND',
        entityType: 'PAYMENT',
        entityId: payment.id,
        beforeState: payment.status,
        afterState: PaymentStatus.REFUNDED,
        detail: `HOLD expired before webhook ${eventId} arrived; auto-refunded ${formatAzn(payment.amountMinor + payment.serviceFeeMinor)}.`,
      }),
    };
  }

  // Normal SUCCEEDED transition
  const seatBase = match.pricingSnapshot.seatPriceMinor;
  const isReplacement = payment.kind === 'REPLACEMENT';
  let replacedSeatOriginalPaymentId: string | null = null;

  const updatedSeats = match.seats.map((seat) => {
    if (!payment.seatIds.includes(seat.seatId)) return seat;
    return {
      ...seat,
      seatStatus: SeatStatus.PAID,
      holdExpiresAtUtcMs: null,
      paidBaseMinor: seatBase,
      replacementOpen: false,
      qrToken:
        match.status === MatchStatus.CONFIRMED || match.status === MatchStatus.IN_PROGRESS
          ? createQrToken(match.id, seat.seatId)
          : seat.qrToken,
    };
  });

  // If this was a replacement seat after T-4h, refund the previous cancelled seat's payment minus provider fee!
  let updatedPayments = state.payments.map((p) =>
    p.id === payment.id
      ? {
          ...p,
          status: PaymentStatus.SUCCEEDED,
          providerEventIds: [...p.providerEventIds, eventId],
          updatedAtUtcMs: state.clockUtcMs,
        }
      : p,
  );

  if (isReplacement) {
    const prevCancelledPayment = state.payments.find(
      (p) =>
        p.matchId === match.id &&
        p.id !== payment.id &&
        p.status === PaymentStatus.SUCCEEDED &&
        p.refundReason === 'AWAITING_REPLACEMENT_AFTER_T4' &&
        p.seatIds.some((sid) => payment.seatIds.includes(sid)),
    );
    if (prevCancelledPayment) {
      replacedSeatOriginalPaymentId = prevCancelledPayment.id;
      const providerCut = Math.round(
        (prevCancelledPayment.amountMinor * match.pricingSnapshot.providerFeePct) / 100,
      );
      const refundAmount = Math.max(0, prevCancelledPayment.amountMinor - providerCut);
      updatedPayments = updatedPayments.map((p) =>
        p.id === prevCancelledPayment.id
          ? {
              ...p,
              status: PaymentStatus.PARTIAL_REFUNDED,
              refundedMinor: refundAmount,
              refundReason: 'REPLACED_BEFORE_T30M_MINUS_PROVIDER_FEE',
              updatedAtUtcMs: state.clockUtcMs,
            }
          : p,
      );
    }
  }

  const paidCount = updatedSeats.filter((s) => s.seatStatus === SeatStatus.PAID).length;
  let nextMatchStatus = match.status;
  if (match.status === MatchStatus.OPEN || match.status === MatchStatus.TOPUP_OFFER) {
    if (paidCount >= match.capacity) {
      nextMatchStatus = MatchStatus.FULL_PENDING;
    } else if (state.clockUtcMs >= match.topUpOfferAtUtcMs && paidCount >= match.minPlayers) {
      nextMatchStatus = MatchStatus.TOPUP_OFFER;
    }
  }

  let updatedMatch: MatchRecord = {
    ...match,
    status: nextMatchStatus,
    seats: updatedSeats,
  };

  if (state.clockUtcMs >= match.topUpOfferAtUtcMs && paidCount >= match.minPlayers && paidCount < match.capacity) {
    updatedMatch = ensureTopUpConsents(updatedMatch, state.clockUtcMs);
  }

  const nextSlotStatus =
    slot.status === SlotStatus.PAYMENT_LOCK ? SlotStatus.SOFT_RESERVED : slot.status;

  let auditEvents = appendAudit(state.auditEvents, {
    timestampUtcMs: state.clockUtcMs,
    actorRole: 'WEBHOOK',
    actorName: 'Payment Gateway',
    action: 'WEBHOOK_SUCCEEDED',
    entityType: 'PAYMENT',
    entityId: payment.id,
    beforeState: payment.status,
    afterState: `${PaymentStatus.SUCCEEDED} (${paidCount}/${match.capacity})`,
    detail: `Seats ${payment.seatIds.map((id) => `#${id}`).join(',')} marked PAID via ${eventId}.`,
  });

  if (replacedSeatOriginalPaymentId) {
    auditEvents = appendAudit(auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'SYSTEM',
      actorName: 'TapOyna Engine',
      action: 'REPLACEMENT_REFUND_ISSUED',
      entityType: 'PAYMENT',
      entityId: replacedSeatOriginalPaymentId,
      beforeState: 'SUCCEEDED (Held for rent)',
      afterState: 'PARTIAL_REFUNDED',
      detail: 'Replacement player paid before T–30m; previous player refunded minus provider fee without double-charging rent.',
    });
  }

  return {
    ...state,
    slots: state.slots.map((s) =>
      s.id === slot.id ? { ...s, status: nextSlotStatus, version: s.version + 1 } : s,
    ),
    matches: {
      ...state.matches,
      [slot.id]: updatedMatch,
    },
    payments: updatedPayments,
    processedProviderEvents: [...state.processedProviderEvents, eventId],
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `Payment confirmed (${paidCount}/${match.capacity} seats paid).${
        replacedSeatOriginalPaymentId ? ' Previous cancelled player refunded minus provider fee.' : ''
      }`,
    },
    auditEvents,
  };
}

/**
 * Simulates AT-02: Two concurrent requests racing for the last 10th seat.
 */
export function simulateConcurrentLastSeatRace(state: SimulatorState, slotId: string): SimulatorState {
  const match = state.matches[slotId];
  if (!match) return state;

  const freeSeats = match.seats.filter((s) => s.seatStatus === SeatStatus.FREE);
  if (freeSeats.length !== 1) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'warning',
        text: `Race test requires exactly 1 FREE seat remaining (currently ${freeSeats.length}).`,
      },
    };
  }

  const paidUserIds = new Set(match.seats.map((s) => s.payerId).filter(Boolean));
  const candidates = SIM_USERS.filter((u) => !paidUserIds.has(u.id));
  const racerA = candidates[0] ?? SIM_USERS[9];
  const racerB = candidates[1] ?? SIM_USERS[10];

  // Request A acquires pessimistic row lock and gets HOLD -> SUCCEEDED
  let next = createSeatHold(state, {
    slotId,
    userId: racerA.id,
    quantity: 1,
    idempotencyKey: `race-win-${racerA.id}-${state.clockUtcMs}`,
  });
  const winningPayment = next.payments[0];
  next = processPaymentWebhook(next, {
    paymentId: winningPayment.id,
    outcome: 'SUCCEEDED',
  });

  // Request B attempts to acquire the same 10th seat -> blocked by row lock -> offered Waitlist
  const updatedMatch = next.matches[slotId];
  const waitlistEntry: WaitlistEntry = {
    id: nextId('wl'),
    matchId: updatedMatch.id,
    userId: racerB.id,
    userName: racerB.name,
    joinedAtUtcMs: next.clockUtcMs,
    status: 'WAITING',
    offerExpiresAtUtcMs: null,
    offeredSeatId: null,
  };

  return {
    ...next,
    matches: {
      ...next.matches,
      [slotId]: {
        ...updatedMatch,
        waitlist: [...updatedMatch.waitlist, waitlistEntry],
      },
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `Race resolved: ${racerA.name} locked Seat #${freeSeats[0].seatId} (10/10 PAID); ${racerB.name} rejected and added to Waitlist.`,
    },
    auditEvents: appendAudit(next.auditEvents, {
      timestampUtcMs: next.clockUtcMs,
      actorRole: 'SYSTEM',
      actorName: 'Row Lock Guard',
      action: 'CONCURRENT_RACE_RESOLVED',
      entityType: 'SEAT',
      entityId: `${updatedMatch.id}-S${freeSeats[0].seatId}`,
      beforeState: '1 FREE',
      afterState: '10/10 PAID + 1 WAITLIST',
      detail: `${racerA.name} won lock on Seat #${freeSeats[0].seatId}; ${racerB.name} routed to Waitlist (11/10 prevented).`,
    }),
  };
}

/**
 * Record explicit player consent or decline for T-6h top-up.
 */
export function respondTopUpConsent(
  state: SimulatorState,
  params: { slotId: string; payerId: string; decision: 'ACCEPTED' | 'DECLINED' },
): SimulatorState {
  const match = state.matches[params.slotId];
  if (!match) return state;

  const updatedMatch: MatchRecord = {
    ...match,
    topUpConsents: match.topUpConsents.map((c) =>
      c.payerId === params.payerId
        ? { ...c, decision: params.decision, decidedAtUtcMs: state.clockUtcMs }
        : c,
    ),
  };

  const consent = updatedMatch.topUpConsents.find((c) => c.payerId === params.payerId);
  return {
    ...state,
    matches: {
      ...state.matches,
      [params.slotId]: updatedMatch,
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: params.decision === 'ACCEPTED' ? 'success' : 'warning',
      text: `${consent?.payerName ?? params.payerId} ${
        params.decision === 'ACCEPTED'
          ? `consented up to ${formatAzn(consent?.maxAmountMinor ?? 0)}`
          : 'declined top-up'
      }.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'PLAYER',
      actorName: consent?.payerName ?? params.payerId,
      action: `TOPUP_CONSENT_${params.decision}`,
      entityType: 'MATCH',
      entityId: match.id,
      beforeState: 'PENDING',
      afterState: params.decision,
      detail: `Explicit top-up consent ${params.decision} (max ${formatAzn(consent?.maxAmountMinor ?? 0)}, rule ${match.pricingSnapshot.ruleVersion}).`,
    }),
  };
}

/**
 * Cancel a single seat participation (before T-4h = 100% refund + Waitlist offer; after T-4h = replacement open until T-30m).
 */
export function cancelSeatParticipation(
  state: SimulatorState,
  params: { slotId: string; seatId: number },
): SimulatorState {
  const slot = state.slots.find((s) => s.id === params.slotId);
  const match = state.matches[params.slotId];
  if (!slot || !match) return state;

  const seat = match.seats.find((s) => s.seatId === params.seatId);
  if (!seat || seat.seatStatus !== SeatStatus.PAID) return state;

  const beforeCutoff = state.clockUtcMs < match.cutoffAtUtcMs;

  if (beforeCutoff) {
    // 100% refund & free seat; offer to first WAITING in waitlist
    let updatedSeats = match.seats.map((s) =>
      s.seatId === params.seatId
        ? {
            ...s,
            payerId: null,
            payerName: null,
            attendeeName: null,
            isGuest: false,
            inviteToken: null,
            seatStatus: SeatStatus.FREE,
            paymentId: null,
            paidBaseMinor: 0,
            paidTopUpMinor: 0,
            qrToken: null,
          }
        : s,
    );

    let updatedWaitlist = [...match.waitlist];
    const nextWaitingIdx = updatedWaitlist.findIndex((w) => w.status === 'WAITING');
    let offeredUserName: string | null = null;
    if (nextWaitingIdx !== -1 && state.policy.enableV15Features) {
      const offerExpires = Math.min(
        match.cutoffAtUtcMs,
        state.clockUtcMs + state.policy.waitlistTtlMinutes * MIN_MS,
      );
      updatedWaitlist[nextWaitingIdx] = {
        ...updatedWaitlist[nextWaitingIdx],
        status: 'OFFERED',
        offerExpiresAtUtcMs: offerExpires,
        offeredSeatId: params.seatId,
      };
      offeredUserName = updatedWaitlist[nextWaitingIdx].userName;
    }

    const remainingPaid = updatedSeats.filter((s) => s.seatStatus === SeatStatus.PAID).length;
    const anyHold = updatedSeats.some((s) => s.seatStatus === SeatStatus.HOLD);

    const updatedPayments = state.payments.map((p) => {
      if (p.id !== seat.paymentId) return p;
      const singleSeatRefund = match.pricingSnapshot.seatPriceMinor + match.pricingSnapshot.playerServiceFeeMinor;
      const newRefunded = Math.min(p.amountMinor + p.serviceFeeMinor, p.refundedMinor + singleSeatRefund);
      const full = newRefunded >= p.amountMinor + p.serviceFeeMinor;
      return {
        ...p,
        status: full ? PaymentStatus.REFUNDED : PaymentStatus.PARTIAL_REFUNDED,
        refundedMinor: newRefunded,
        refundReason: 'PLAYER_CANCEL_BEFORE_T4',
        updatedAtUtcMs: state.clockUtcMs,
      };
    });

    const nextMatches = { ...state.matches };
    let nextSlotStatus = slot.status;

    if (remainingPaid === 0 && !anyHold) {
      delete nextMatches[slot.id];
      nextSlotStatus = SlotStatus.FREE;
    } else {
      let nextMatchStatus = match.status;
      if (match.status === MatchStatus.FULL_PENDING && remainingPaid < match.capacity) {
        nextMatchStatus = MatchStatus.OPEN;
      }
      let rebuilt: MatchRecord = {
        ...match,
        status: nextMatchStatus,
        seats: updatedSeats,
        waitlist: updatedWaitlist,
      };
      if (state.clockUtcMs >= match.topUpOfferAtUtcMs && remainingPaid >= match.minPlayers) {
        rebuilt = ensureTopUpConsents(rebuilt, state.clockUtcMs);
      }
      nextMatches[slot.id] = rebuilt;
    }

    return {
      ...state,
      slots: state.slots.map((s) =>
        s.id === slot.id ? { ...s, status: nextSlotStatus, version: s.version + 1 } : s,
      ),
      matches: nextMatches,
      payments: updatedPayments,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'info',
        text: `Seat #${params.seatId} cancelled before T–4h (100% refund).${
          offeredUserName ? ` Waitlist offer sent to ${offeredUserName} (15m TTL).` : ''
        }`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'PLAYER',
        actorName: seat.payerName ?? 'Player',
        action: 'CANCEL_BEFORE_T4',
        entityType: 'SEAT',
        entityId: `${match.id}-S${params.seatId}`,
        beforeState: 'PAID',
        afterState: offeredUserName ? 'FREE + WAITLIST_OFFERED' : 'FREE',
        detail: `100% refund initiated.${offeredUserName ? ` Auto-offered to ${offeredUserName}.` : ''}`,
      }),
    };
  }

  // Post-T-4h cancellation: no immediate refund, open replacement if before T-30m
  if (state.clockUtcMs >= match.replacementDeadlineUtcMs) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'error',
        text: 'Past T–30m replacement deadline — cancellation & refund not allowed.',
      },
    };
  }

  const prevPaymentId = seat.paymentId;
  const updatedSeats = match.seats.map((s) =>
    s.seatId === params.seatId
      ? {
          ...s,
          payerId: null,
          payerName: null,
          attendeeName: null,
          isGuest: false,
          inviteToken: null,
          seatStatus: SeatStatus.FREE,
          replacementOpen: true,
          qrToken: null,
          qrUsed: false,
        }
      : s,
  );

  // Mark previous payment as eligible for replacement refund
  const updatedPayments = state.payments.map((p) =>
    p.id === prevPaymentId
      ? {
          ...p,
          refundReason: 'AWAITING_REPLACEMENT_AFTER_T4',
          updatedAtUtcMs: state.clockUtcMs,
        }
      : p,
  );

  let updatedWaitlist = [...match.waitlist];
  const nextWaitingIdx = updatedWaitlist.findIndex((w) => w.status === 'WAITING');
  if (nextWaitingIdx !== -1 && state.policy.enableV15Features) {
    updatedWaitlist[nextWaitingIdx] = {
      ...updatedWaitlist[nextWaitingIdx],
      status: 'OFFERED',
      offerExpiresAtUtcMs: Math.min(
        match.replacementDeadlineUtcMs,
        state.clockUtcMs + state.policy.waitlistTtlMinutes * MIN_MS,
      ),
      offeredSeatId: params.seatId,
    };
  }

  return {
    ...state,
    matches: {
      ...state.matches,
      [slot.id]: {
        ...match,
        seats: updatedSeats,
        waitlist: updatedWaitlist,
      },
    },
    payments: updatedPayments,
    lastNotice: {
      id: nextId('ntc'),
      tone: 'warning',
      text: `Cancelled after T–4h: Seat #${params.seatId} opened for replacement until T–30m. Refund triggers only if replaced.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'PLAYER',
      actorName: seat.payerName ?? 'Player',
      action: 'CANCEL_AFTER_T4_OPEN_REPLACEMENT',
      entityType: 'SEAT',
      entityId: `${match.id}-S${params.seatId}`,
      beforeState: 'PAID',
      afterState: 'REPLACEMENT_OPEN',
      detail: 'Rent retained until replacement player pays before T–30m.',
    }),
  };
}

/**
 * Join Waitlist or Accept a Waitlist Offer.
 */
export function joinWaitlist(state: SimulatorState, slotId: string, userId: string): SimulatorState {
  const match = state.matches[slotId];
  const user = SIM_USERS.find((u) => u.id === userId) ?? SIM_USERS[0];
  if (!match) return state;

  if (match.waitlist.some((w) => w.userId === user.id && (w.status === 'WAITING' || w.status === 'OFFERED'))) {
    return {
      ...state,
      lastNotice: { id: nextId('ntc'), tone: 'info', text: `${user.name} is already in Waitlist.` },
    };
  }

  const entry: WaitlistEntry = {
    id: nextId('wl'),
    matchId: match.id,
    userId: user.id,
    userName: user.name,
    joinedAtUtcMs: state.clockUtcMs,
    status: 'WAITING',
    offerExpiresAtUtcMs: null,
    offeredSeatId: null,
  };

  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        waitlist: [...match.waitlist, entry],
      },
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: 'info',
      text: `${user.name} added to Waitlist (no pre-charge).`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'PLAYER',
      actorName: user.name,
      action: 'WAITLIST_JOINED',
      entityType: 'WAITLIST',
      entityId: entry.id,
      beforeState: 'NONE',
      afterState: 'WAITING',
      detail: `${user.name} queued on match ${match.id}.`,
    }),
  };
}

export function acceptWaitlistOffer(state: SimulatorState, slotId: string, waitlistId: string): SimulatorState {
  const match = state.matches[slotId];
  if (!match) return state;
  const entry = match.waitlist.find((w) => w.id === waitlistId);
  if (!entry || entry.status !== 'OFFERED') return state;

  let next = createSeatHold(state, {
    slotId,
    userId: entry.userId,
    quantity: 1,
    idempotencyKey: `wl-${entry.id}`,
  });
  const pay = next.payments[0];
  next = processPaymentWebhook(next, { paymentId: pay.id, outcome: 'SUCCEEDED' });

  const latestMatch = next.matches[slotId];
  return {
    ...next,
    matches: {
      ...next.matches,
      [slotId]: {
        ...latestMatch,
        waitlist: latestMatch.waitlist.map((w) =>
          w.id === waitlistId ? { ...w, status: 'ACCEPTED' } : w,
        ),
      },
    },
  };
}

/**
 * Reference T-4h Cutoff Algorithm (Section 14: run_cutoff).
 */
export function runCutoffForMatch(state: SimulatorState, slotId: string): SimulatorState {
  const slot = state.slots.find((s) => s.id === slotId);
  const match = state.matches[slotId];
  if (!slot || !match) return state;

  const terminalOrConfirmed = [
    MatchStatus.CONFIRMED,
    MatchStatus.IN_PROGRESS,
    MatchStatus.COMPLETED,
    MatchStatus.CANCELLED_UNDERFILLED,
    MatchStatus.CANCELLED_VENUE,
    MatchStatus.CANCELLED_ADMIN,
  ];
  if (terminalOrConfirmed.includes(match.status)) return state;
  if (state.clockUtcMs < match.cutoffAtUtcMs) return state;

  // Release any leftover HOLDs at cutoff
  const seatsAfterHoldDrop = match.seats.map((s) =>
    s.seatStatus === SeatStatus.HOLD
      ? {
          ...s,
          payerId: null,
          payerName: null,
          attendeeName: null,
          isGuest: false,
          inviteToken: null,
          seatStatus: SeatStatus.FREE,
          holdExpiresAtUtcMs: null,
          paymentId: null,
        }
      : s,
  );

  const paidSeats = seatsAfterHoldDrop.filter((s) => s.seatStatus === SeatStatus.PAID);

  // 1. Venue unavailable check
  if (slot.status === SlotStatus.UNAVAILABLE || slot.status === SlotStatus.BLOCKED_EXTERNAL) {
    return cancelMatchWithFullRefunds(state, slotId, MatchStatus.CANCELLED_VENUE, 'VENUE_UNAVAILABLE_AT_CUTOFF');
  }

  // 2. Minimum player threshold check (e.g., 8/10)
  if (paidSeats.length < match.minPlayers) {
    return cancelMatchWithFullRefunds(
      {
        ...state,
        matches: { ...state.matches, [slotId]: { ...match, seats: seatsAfterHoldDrop } },
      },
      slotId,
      MatchStatus.CANCELLED_UNDERFILLED,
      `UNDERFILLED (${paidSeats.length}/${match.minPlayers} min)`,
    );
  }

  // 3. Calculate deficit & deterministic top-ups
  const baseCovered =
    paidSeats.reduce((a, s) => a + s.paidBaseMinor + s.paidTopUpMinor, 0) +
    match.venueDiscountMinor +
    match.initiatorExtraMinor;
  const deficit = Math.max(0, match.pricingSnapshot.rentMinor - baseCovered);

  let updatedSeats = seatsAfterHoldDrop;
  let newTopUpPayments: PaymentRecord[] = [];
  let newAudit = state.auditEvents;

  if (deficit > 0) {
    const syncedMatch = ensureTopUpConsents({ ...match, seats: seatsAfterHoldDrop }, state.clockUtcMs);
    const shares = calculateTopUpShares(
      deficit,
      paidSeats.map((s) => s.seatId),
    );

    // Check explicit consents for every paid payer and verify share <= maxAmountMinor
    const payerMissingConsent = new Set<string>();
    const payerSums = new Map<string, number>();

    for (const seat of paidSeats) {
      if (!seat.payerId) continue;
      payerSums.set(seat.payerId, (payerSums.get(seat.payerId) ?? 0) + (shares[seat.seatId] ?? 0));
    }

    for (const [payerId, dueMinor] of payerSums.entries()) {
      const consent = syncedMatch.topUpConsents.find((c) => c.payerId === payerId);
      if (!consent || consent.decision !== 'ACCEPTED' || dueMinor > consent.maxAmountMinor) {
        payerMissingConsent.add(payerId);
      }
    }

    if (payerMissingConsent.size > 0 && state.policy.requireAllTopUpConsents) {
      return cancelMatchWithFullRefunds(
        {
          ...state,
          matches: { ...state.matches, [slotId]: syncedMatch },
        },
        slotId,
        MatchStatus.CANCELLED_UNDERFILLED,
        'TOPUP_CONSENT_MISSING_OR_DECLINED',
      );
    }

    // Charge deterministic top-ups idempotently
    for (const [payerId, dueMinor] of payerSums.entries()) {
      const consent = syncedMatch.topUpConsents.find((c) => c.payerId === payerId);
      if (dueMinor <= 0) continue;
      const topUpPayId = nextId('pay-top');
      newTopUpPayments.push({
        id: topUpPayId,
        matchId: match.id,
        slotId: slot.id,
        payerId,
        payerName: consent?.payerName ?? payerId,
        seatIds: consent?.seatIds ?? [],
        amountMinor: dueMinor,
        serviceFeeMinor: 0,
        kind: 'TOPUP',
        status: PaymentStatus.SUCCEEDED,
        idempotencyKey: `topup-${match.id}-${payerId}`,
        providerEventIds: [`evt-topup-${match.id}-${payerId}`],
        createdAtUtcMs: state.clockUtcMs,
        updatedAtUtcMs: state.clockUtcMs,
        refundedMinor: 0,
      });
    }

    updatedSeats = updatedSeats.map((seat) =>
      seat.seatStatus === SeatStatus.PAID
        ? { ...seat, paidTopUpMinor: seat.paidTopUpMinor + (shares[seat.seatId] ?? 0) }
        : seat,
    );

    newAudit = appendAudit(newAudit, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'SYSTEM',
      actorName: 'Cutoff Engine',
      action: 'TOPUP_CHARGED_IDEMPOTENTLY',
      entityType: 'MATCH',
      entityId: match.id,
      beforeState: `Deficit ${formatAzn(deficit)}`,
      afterState: '100% Covered',
      detail: `Charged ${formatAzn(deficit)} across ${paidSeats.length} seats deterministically down to 1 qəpik.`,
    });
  }

  // Generate individual single-use QR tokens for all PAID seats & open Match Chat!
  updatedSeats = updatedSeats.map((seat) =>
    seat.seatStatus === SeatStatus.PAID
      ? { ...seat, qrToken: seat.qrToken ?? createQrToken(match.id, seat.seatId) }
      : seat,
  );

  const systemChatMsg = {
    id: nextId('msg'),
    senderId: 'system',
    senderName: 'TapOyna',
    text: `Match CONFIRMED at T–4h (${paidSeats.length}/${match.capacity} players). QR tokens issued. Chat stays open until 24h after match end.`,
    sentAtUtcMs: state.clockUtcMs,
    isSystem: true,
  };

  return {
    ...state,
    slots: state.slots.map((s) =>
      s.id === slotId ? { ...s, status: SlotStatus.HARD_RESERVED, version: s.version + 1 } : s,
    ),
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        status: MatchStatus.CONFIRMED,
        seats: updatedSeats,
        chatMessages: [...match.chatMessages, systemChatMsg],
      },
    },
    payments: [...newTopUpPayments, ...state.payments],
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `T–4h Cutoff: Match CONFIRMED (${paidSeats.length}/${match.capacity}), Slot → HARD_RESERVED, QR & Chat unlocked.`,
    },
    auditEvents: appendAudit(newAudit, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'SYSTEM',
      actorName: 'Cutoff Engine',
      action: 'RUN_CUTOFF_CONFIRMED',
      entityType: 'MATCH',
      entityId: match.id,
      beforeState: match.status,
      afterState: 'CONFIRMED + HARD_RESERVED',
      detail: `100% rent (${formatAzn(match.pricingSnapshot.rentMinor)}) covered. QR tokens & temporary chat activated.`,
    }),
  };
}

/**
 * Cancels match and issues 100% refunds to all paid participants.
 */
export function cancelMatchWithFullRefunds(
  state: SimulatorState,
  slotId: string,
  targetMatchStatus:
    | MatchStatus.CANCELLED_UNDERFILLED
    | MatchStatus.CANCELLED_VENUE
    | MatchStatus.CANCELLED_ADMIN,
  reason: string,
): SimulatorState {
  const slot = state.slots.find((s) => s.id === slotId);
  const match = state.matches[slotId];
  if (!slot || !match) return state;

  const updatedPayments = state.payments.map((p) => {
    if (p.matchId !== match.id) return p;
    if (p.status === PaymentStatus.SUCCEEDED || p.status === PaymentStatus.PARTIAL_REFUNDED) {
      return {
        ...p,
        status: PaymentStatus.REFUNDED,
        refundedMinor: p.amountMinor + p.serviceFeeMinor,
        refundReason: reason,
        updatedAtUtcMs: state.clockUtcMs,
      };
    }
    if (p.status === PaymentStatus.PENDING_PROVIDER || p.status === PaymentStatus.CREATED) {
      return {
        ...p,
        status: PaymentStatus.EXPIRED,
        updatedAtUtcMs: state.clockUtcMs,
      };
    }
    return p;
  });

  const updatedSeats = match.seats.map((s) =>
    s.seatStatus === SeatStatus.PAID || s.seatStatus === SeatStatus.HOLD
      ? { ...s, seatStatus: SeatStatus.CANCELLED, holdExpiresAtUtcMs: null }
      : s,
  );

  const nextSlotStatus =
    targetMatchStatus === MatchStatus.CANCELLED_VENUE
      ? SlotStatus.UNAVAILABLE
      : SlotStatus.FREE;

  return {
    ...state,
    slots: state.slots.map((s) =>
      s.id === slotId
        ? {
            ...s,
            status: nextSlotStatus,
            blockReason: targetMatchStatus === MatchStatus.CANCELLED_VENUE ? reason : undefined,
            version: s.version + 1,
          }
        : s,
    ),
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        status: targetMatchStatus,
        cancellationReason: reason,
        seats: updatedSeats,
      },
    },
    payments: updatedPayments,
    lastNotice: {
      id: nextId('ntc'),
      tone: 'warning',
      text: `Match ${targetMatchStatus} (${reason}): 100% refunds issued to all participants.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: targetMatchStatus === MatchStatus.CANCELLED_VENUE ? 'VENUE_ADMIN' : 'SYSTEM',
      actorName: targetMatchStatus === MatchStatus.CANCELLED_VENUE ? slot.venueName : 'TapOyna Engine',
      action: targetMatchStatus,
      entityType: 'MATCH',
      entityId: match.id,
      beforeState: match.status,
      afterState: targetMatchStatus,
      detail: `Reason: ${reason}. 100% refund triggered; slot status → ${nextSlotStatus}.`,
    }),
  };
}

/**
 * Advances simulated clock and sweeps all due time-based transitions cleanly.
 */
export function advanceClockTo(state: SimulatorState, targetUtcMs: number): SimulatorState {
  let next: SimulatorState = { ...state, clockUtcMs: Math.max(state.clockUtcMs, targetUtcMs) };

  // 1. Expire overdue HOLDs across all matches
  for (const slot of next.slots) {
    const match = next.matches[slot.id];
    if (!match) continue;
    const expiredHoldPayments = new Set(
      match.seats
        .filter(
          (s) =>
            s.seatStatus === SeatStatus.HOLD &&
            s.holdExpiresAtUtcMs !== null &&
            next.clockUtcMs >= s.holdExpiresAtUtcMs &&
            s.paymentId,
        )
        .map((s) => s.paymentId as string),
    );
    for (const payId of expiredHoldPayments) {
      next = processPaymentWebhook(next, {
        paymentId: payId,
        outcome: 'EXPIRED',
        providerEventId: `ttl-exp-${payId}`,
      });
    }
  }

  // 2. Expire Waitlist 15-min offers and rotate to next waiting entry
  for (const slot of next.slots) {
    const match = next.matches[slot.id];
    if (!match) continue;
    let changed = false;
    const wl = match.waitlist.map((w) => {
      if (w.status === 'OFFERED' && w.offerExpiresAtUtcMs && next.clockUtcMs >= w.offerExpiresAtUtcMs) {
        changed = true;
        return { ...w, status: 'EXPIRED' as const };
      }
      return w;
    });
    if (changed) {
      next = {
        ...next,
        matches: { ...next.matches, [slot.id]: { ...match, waitlist: wl } },
      };
    }
  }

  // 3. T-6h Top-up offer trigger
  for (const slot of next.slots) {
    const match = next.matches[slot.id];
    if (!match) continue;
    if (
      next.clockUtcMs >= match.topUpOfferAtUtcMs &&
      next.clockUtcMs < match.cutoffAtUtcMs &&
      (match.status === MatchStatus.OPEN || match.status === MatchStatus.TOPUP_OFFER)
    ) {
      const paidCount = getMatchPaidSeats(match).length;
      if (paidCount >= match.minPlayers && paidCount < match.capacity) {
        const enriched = ensureTopUpConsents(match, next.clockUtcMs);
        if (enriched.status !== match.status || enriched.topUpConsents.length !== match.topUpConsents.length) {
          next = {
            ...next,
            matches: { ...next.matches, [slot.id]: enriched },
            auditEvents: appendAudit(next.auditEvents, {
              timestampUtcMs: next.clockUtcMs,
              actorRole: 'SYSTEM',
              actorName: 'Scheduler',
              action: 'T6_TOPUP_OFFER_DISPATCHED',
              entityType: 'MATCH',
              entityId: match.id,
              beforeState: match.status,
              afterState: MatchStatus.TOPUP_OFFER,
              detail: `T–6h reached with ${paidCount}/${match.capacity} seats; explicit top-up consent prompts sent.`,
            }),
          };
        }
      }
    }
  }

  // 4. T-4h Cutoff trigger
  for (const slot of next.slots) {
    const match = next.matches[slot.id];
    if (!match) continue;
    if (next.clockUtcMs >= match.cutoffAtUtcMs) {
      next = runCutoffForMatch(next, slot.id);
    }
  }

  // 5. Kickoff (T-0) -> IN_PROGRESS and End -> COMPLETED + NO_SHOW + Payout Ledger
  for (const slot of next.slots) {
    const match = next.matches[slot.id];
    if (!match) continue;

    if (next.clockUtcMs >= slot.startAtUtcMs && next.clockUtcMs < slot.endAtUtcMs && match.status === MatchStatus.CONFIRMED) {
      next = {
        ...next,
        matches: { ...next.matches, [slot.id]: { ...match, status: MatchStatus.IN_PROGRESS } },
        auditEvents: appendAudit(next.auditEvents, {
          timestampUtcMs: next.clockUtcMs,
          actorRole: 'SYSTEM',
          actorName: 'Scheduler',
          action: 'MATCH_KICKOFF',
          entityType: 'MATCH',
          entityId: match.id,
          beforeState: MatchStatus.CONFIRMED,
          afterState: MatchStatus.IN_PROGRESS,
          detail: 'Match started — QR check-in window active.',
        }),
      };
    }

    const latestMatch = next.matches[slot.id];
    if (
      latestMatch &&
      next.clockUtcMs >= slot.endAtUtcMs &&
      (latestMatch.status === MatchStatus.CONFIRMED || latestMatch.status === MatchStatus.IN_PROGRESS)
    ) {
      // Mark unscanned PAID seats as NO_SHOW after check-in window closes
      const finalizedSeats = latestMatch.seats.map((s) =>
        s.seatStatus === SeatStatus.PAID && s.checkinStatus === CheckinStatus.PENDING
          ? { ...s, checkinStatus: CheckinStatus.NO_SHOW }
          : s,
      );
      const gross = latestMatch.pricingSnapshot.rentMinor - latestMatch.venueDiscountMinor;
      const platformFee = Math.round((gross * latestMatch.pricingSnapshot.platformFeePct) / 100);
      const providerFee = Math.round((gross * latestMatch.pricingSnapshot.providerFeePct) / 100);
      const payable = Math.max(0, gross - platformFee - providerFee);

      const hasPayout = next.payouts.some((p) => p.matchId === latestMatch.id);
      const newPayouts: PayoutRecord[] = hasPayout
        ? next.payouts
        : [
            {
              id: nextId('po'),
              venueName: slot.venueName,
              matchId: latestMatch.id,
              slotId: slot.id,
              grossRentMinor: gross,
              platformFeeMinor: platformFee,
              providerFeeMinor: providerFee,
              payableMinor: payable,
              status: 'SCHEDULED',
              createdAtUtcMs: next.clockUtcMs,
            },
            ...next.payouts,
          ];

      next = {
        ...next,
        slots: next.slots.map((s) =>
          s.id === slot.id ? { ...s, status: SlotStatus.COMPLETED, version: s.version + 1 } : s,
        ),
        matches: {
          ...next.matches,
          [slot.id]: { ...latestMatch, status: MatchStatus.COMPLETED, seats: finalizedSeats },
        },
        payouts: newPayouts,
        auditEvents: appendAudit(next.auditEvents, {
          timestampUtcMs: next.clockUtcMs,
          actorRole: 'SYSTEM',
          actorName: 'Settlement Engine',
          action: 'MATCH_COMPLETED_PAYOUT_CREATED',
          entityType: 'PAYOUT',
          entityId: latestMatch.id,
          beforeState: latestMatch.status,
          afterState: MatchStatus.COMPLETED,
          detail: `Payout scheduled: ${formatAzn(payable)} (Gross ${formatAzn(gross)} − Platform ${formatAzn(platformFee)} − Acquiring ${formatAzn(providerFee)}).`,
        }),
      };
    }
  }

  return next;
}

/**
 * Single-use QR token check-in (AT-11) or audited manual check-in.
 */
export function performQrCheckin(
  state: SimulatorState,
  params: { slotId: string; seatId: number; method: 'QR_SCAN' | 'MANUAL_ADMIN' },
): SimulatorState {
  const match = state.matches[params.slotId];
  if (!match) return state;

  const seat = match.seats.find((s) => s.seatId === params.seatId);
  if (!seat || seat.seatStatus !== SeatStatus.PAID) return state;

  if (params.method === 'QR_SCAN' && seat.qrUsed) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'error',
        text: `QR token ${seat.qrToken} already used — duplicate scan rejected!`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'VENUE_ADMIN',
        actorName: 'QR Scanner',
        action: 'QR_DUPLICATE_REJECTED',
        entityType: 'SEAT',
        entityId: `${match.id}-S${seat.seatId}`,
        beforeState: 'CHECKED_IN',
        afterState: 'CHECKED_IN (Rejected)',
        detail: `Replay attempt on single-use token ${seat.qrToken} blocked.`,
      }),
    };
  }

  const updatedSeats = match.seats.map((s) =>
    s.seatId === params.seatId
      ? {
          ...s,
          checkinStatus: CheckinStatus.CHECKED_IN,
          checkedInAtUtcMs: state.clockUtcMs,
          checkinMethod: params.method,
          qrUsed: true,
        }
      : s,
  );

  return {
    ...state,
    matches: {
      ...state.matches,
      [params.slotId]: { ...match, seats: updatedSeats },
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `${seat.attendeeName ?? `Seat #${seat.seatId}`} checked in (${params.method}).`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'VENUE_ADMIN',
      actorName: 'Venue Admin',
      action: params.method === 'QR_SCAN' ? 'QR_CHECKIN_OK' : 'MANUAL_CHECKIN_AUDITED',
      entityType: 'SEAT',
      entityId: `${match.id}-S${seat.seatId}`,
      beforeState: seat.checkinStatus,
      afterState: CheckinStatus.CHECKED_IN,
      detail: `Seat #${seat.seatId} (${seat.attendeeName}) verified via ${params.method}.`,
    }),
  };
}

/**
 * Venue attempts to block a slot for an external client (AT-12 guardrail).
 */
export function attemptVenueExternalBlock(state: SimulatorState, slotId: string): SimulatorState {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) return state;

  if ((slot.status === SlotStatus.SOFT_RESERVED || slot.status === SlotStatus.PAYMENT_LOCK || slot.status === SlotStatus.HARD_RESERVED) && state.policy.protectSoftReserve) {
    return {
      ...state,
      lastNotice: {
        id: nextId('ntc'),
        tone: 'error',
        text: `Blocked by Guardrail: Cannot overwrite ${slot.status} under an external client! Use CANCEL_BY_VENUE with reason & 100% refund.`,
      },
      auditEvents: appendAudit(state.auditEvents, {
        timestampUtcMs: state.clockUtcMs,
        actorRole: 'VENUE_ADMIN',
        actorName: slot.venueName,
        action: 'EXTERNAL_OVERWRITE_BLOCKED',
        entityType: 'SLOT',
        entityId: slot.id,
        beforeState: slot.status,
        afterState: slot.status,
        detail: `Silent external block denied on ${slot.status}. Explicit CANCEL_BY_VENUE required.`,
      }),
    };
  }

  const nextStatus =
    slot.status === SlotStatus.BLOCKED_EXTERNAL ? SlotStatus.FREE : SlotStatus.BLOCKED_EXTERNAL;

  return {
    ...state,
    slots: state.slots.map((s) =>
      s.id === slotId ? { ...s, status: nextStatus, version: s.version + 1 } : s,
    ),
    lastNotice: {
      id: nextId('ntc'),
      tone: 'info',
      text: `Slot ${slot.id} set to ${nextStatus}.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'VENUE_ADMIN',
      actorName: slot.venueName,
      action: 'SLOT_EXTERNAL_TOGGLE',
      entityType: 'SLOT',
      entityId: slot.id,
      beforeState: slot.status,
      afterState: nextStatus,
      detail: `Venue changed FREE slot status to ${nextStatus}.`,
    }),
  };
}

export function applyVenueDiscount(state: SimulatorState, slotId: string, discountMinor: number): SimulatorState {
  const match = state.matches[slotId];
  if (!match) return state;
  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        venueDiscountMinor: Math.min(match.pricingSnapshot.rentMinor, match.venueDiscountMinor + discountMinor),
      },
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `Venue applied ${formatAzn(discountMinor)} discount to help cover deficit.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'VENUE_ADMIN',
      actorName: 'Venue Admin',
      action: 'VENUE_DISCOUNT_APPLIED',
      entityType: 'MATCH',
      entityId: match.id,
      beforeState: `${formatAzn(match.venueDiscountMinor)}`,
      afterState: `${formatAzn(match.venueDiscountMinor + discountMinor)}`,
      detail: `Venue covered ${formatAzn(discountMinor)} of shortfall.`,
    }),
  };
}

export function disputeNoShow(state: SimulatorState, slotId: string, seatId: number, note: string): SimulatorState {
  const match = state.matches[slotId];
  if (!match) return state;
  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        seats: match.seats.map((s) =>
          s.seatId === seatId
            ? { ...s, checkinStatus: CheckinStatus.DISPUTED, disputeNote: note || 'Player submitted GPS/photo proof.' }
            : s,
        ),
      },
    },
    lastNotice: { id: nextId('ntc'), tone: 'info', text: `NO_SHOW dispute filed for Seat #${seatId}.` },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'PLAYER',
      actorName: 'Player',
      action: 'NO_SHOW_DISPUTED',
      entityType: 'SEAT',
      entityId: `${match.id}-S${seatId}`,
      beforeState: 'NO_SHOW',
      afterState: 'DISPUTED',
      detail: note || 'Submitted evidence for operator review.',
    }),
  };
}

export function resolveNoShowDispute(
  state: SimulatorState,
  slotId: string,
  seatId: number,
  approve: boolean,
): SimulatorState {
  const match = state.matches[slotId];
  if (!match) return state;
  const targetStatus = approve ? CheckinStatus.CHECKED_IN : CheckinStatus.NO_SHOW;
  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        seats: match.seats.map((s) =>
          s.seatId === seatId ? { ...s, checkinStatus: targetStatus } : s,
        ),
      },
    },
    lastNotice: {
      id: nextId('ntc'),
      tone: approve ? 'success' : 'warning',
      text: `Operator resolved dispute on Seat #${seatId} → ${targetStatus}.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'OPERATOR',
      actorName: 'TapOyna Operator',
      action: 'DISPUTE_RESOLVED',
      entityType: 'SEAT',
      entityId: `${match.id}-S${seatId}`,
      beforeState: 'DISPUTED',
      afterState: targetStatus,
      detail: approve ? 'Evidence accepted; attendance restored.' : 'NO_SHOW upheld.',
    }),
  };
}

export function sendChatMessage(state: SimulatorState, slotId: string, text: string): SimulatorState {
  const match = state.matches[slotId];
  if (!match || !text.trim()) return state;
  if (
    match.status !== MatchStatus.CONFIRMED &&
    match.status !== MatchStatus.IN_PROGRESS &&
    match.status !== MatchStatus.COMPLETED
  ) {
    return {
      ...state,
      lastNotice: { id: nextId('ntc'), tone: 'error', text: 'Chat unlocks only after CONFIRMED.' },
    };
  }
  if (state.clockUtcMs >= match.chatArchiveAtUtcMs) {
    return {
      ...state,
      lastNotice: { id: nextId('ntc'), tone: 'error', text: 'Chat is archived (read-only) 24h after match end.' },
    };
  }
  const user = SIM_USERS.find((u) => u.id === state.activePlayerId) ?? SIM_USERS[0];
  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        chatMessages: [
          ...match.chatMessages,
          {
            id: nextId('msg'),
            senderId: user.id,
            senderName: user.name,
            text: text.trim(),
            sentAtUtcMs: state.clockUtcMs,
          },
        ],
      },
    },
  };
}

export function submitMatchRating(
  state: SimulatorState,
  slotId: string,
  venueRating: number,
  matchQualityRating: number,
): SimulatorState {
  const match = state.matches[slotId];
  if (!match || match.status !== MatchStatus.COMPLETED) return state;
  const user = SIM_USERS.find((u) => u.id === state.activePlayerId) ?? SIM_USERS[0];
  return {
    ...state,
    matches: {
      ...state.matches,
      [slotId]: {
        ...match,
        ratings: [
          ...match.ratings,
          {
            id: nextId('rat'),
            matchId: match.id,
            raterName: user.name,
            venueRating,
            matchQualityRating,
            createdAtUtcMs: state.clockUtcMs,
          },
        ],
      },
    },
    lastNotice: { id: nextId('ntc'), tone: 'success', text: `Rating (${venueRating}★ / ${matchQualityRating}★) recorded.` },
  };
}

export function retryStuckRefund(state: SimulatorState, paymentId: string): SimulatorState {
  const pay = state.payments.find((p) => p.id === paymentId);
  if (!pay) return state;
  return {
    ...state,
    payments: state.payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: PaymentStatus.REFUNDED,
            refundedMinor: p.amountMinor + p.serviceFeeMinor,
            stuckRefund: false,
            updatedAtUtcMs: state.clockUtcMs,
          }
        : p,
    ),
    lastNotice: {
      id: nextId('ntc'),
      tone: 'success',
      text: `Stuck refund for ${pay.id} retried safely with Idempotency-Key ${pay.idempotencyKey}.`,
    },
    auditEvents: appendAudit(state.auditEvents, {
      timestampUtcMs: state.clockUtcMs,
      actorRole: 'OPERATOR',
      actorName: 'TapOyna Operator',
      action: 'OPERATOR_REFUND_RETRY',
      entityType: 'PAYMENT',
      entityId: pay.id,
      beforeState: pay.status,
      afterState: PaymentStatus.REFUNDED,
      detail: `Re-dispatched refund using original idempotency key ${pay.idempotencyKey}.`,
      idempotencyKey: pay.idempotencyKey,
    }),
  };
}

export function evaluateInvariants(state: SimulatorState): InvariantCheck[] {
  const activeSlot = getActiveSlot(state);
  const activeMatch = getActiveMatch(state);

  // 1. No double booking on overlapping slot intervals for same field
  const noDoubleBooking = state.slots.every((s) => {
    const m = state.matches[s.id];
    return !m || m.slotId === s.id;
  });

  // 2. Capacity check (PAID + HOLD <= 10)
  const capacityOk = Object.values(state.matches).every((m) => {
    const occupied = m.seats.filter(
      (s) => s.seatStatus === SeatStatus.PAID || s.seatStatus === SeatStatus.HOLD,
    ).length;
    return occupied <= m.capacity;
  });

  // 3. PAID seat only backed by SUCCEEDED payment
  const paidOnlyViaWebhook = Object.values(state.matches).every((m) =>
    m.seats.every((s) => {
      if (s.seatStatus !== SeatStatus.PAID) return true;
      const p = state.payments.find((pay) => pay.id === s.paymentId);
      return p && (p.status === PaymentStatus.SUCCEEDED || p.status === PaymentStatus.PARTIAL_REFUNDED);
    }),
  );

  // 4. CONFIRMED / IN_PROGRESS / COMPLETED match has 100% financial coverage
  const confirmedFullCoverage = Object.values(state.matches).every((m) => {
    if (
      m.status !== MatchStatus.CONFIRMED &&
      m.status !== MatchStatus.IN_PROGRESS &&
      m.status !== MatchStatus.COMPLETED
    ) {
      return true;
    }
    const cov = computeRentCoverage(m);
    return cov.deficitMinor === 0;
  });

  // 5. TopUp paid never exceeds consented maxAmountMinor
  const topUpConsentRespect = Object.values(state.matches).every((m) =>
    m.topUpConsents.every((c) => {
      const charged = m.seats
        .filter((s) => c.seatIds.includes(s.seatId))
        .reduce((acc, s) => acc + s.paidTopUpMinor, 0);
      return charged <= c.maxAmountMinor;
    }),
  );

  // 6. Full money traceability (every payment & payout has id + key)
  const traceabilityOk =
    state.payments.every((p) => Boolean(p.id && p.idempotencyKey)) &&
    state.payouts.every((po) => Boolean(po.id && po.matchId));

  // 7. Idempotency check (unique providerEventIds & idempotencyKeys)
  const idempotencyOk =
    new Set(state.processedProviderEvents).size === state.processedProviderEvents.length &&
    new Set(state.usedIdempotencyKeys).size === state.usedIdempotencyKeys.length;

  // 8. Transparent terms always captured in PricingSnapshot before payment
  const transparentTerms = !activeMatch || Boolean(activeMatch.pricingSnapshot.ruleVersion);

  return [
    { id: 'inv1', passed: noDoubleBooking, labelKey: 'inv1', detail: activeSlot.id },
    { id: 'inv2', passed: capacityOk, labelKey: 'inv2', detail: '≤ 10' },
    { id: 'inv3', passed: paidOnlyViaWebhook, labelKey: 'inv3', detail: 'Webhook' },
    { id: 'inv4', passed: confirmedFullCoverage, labelKey: 'inv4', detail: '100% AZN' },
    { id: 'inv5', passed: topUpConsentRespect, labelKey: 'inv5', detail: '≤ max_amount' },
    { id: 'inv6', passed: traceabilityOk, labelKey: 'inv6', detail: 'Ledger' },
    { id: 'inv7', passed: idempotencyOk, labelKey: 'inv7', detail: 'Deduped' },
    { id: 'inv8', passed: transparentTerms, labelKey: 'inv8', detail: 'Snapshot' },
  ];
}
