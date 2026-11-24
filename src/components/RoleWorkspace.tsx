import React, { useState } from 'react';
import {
  Users,
  Building2,
  Shield,
  Send,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  MessageSquare,
  Star,
} from 'lucide-react';
import {
  CheckinStatus,
  Language,
  MatchRecord,
  MatchStatus,
  PaymentStatus,
  Role,
  SeatStatus,
  SimulatorState,
  SlotRecord,
  SlotStatus,
} from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';
import { SIM_USERS, getMatchPaidSeats } from '../engine/simulator';
import { formatAzn, formatBakuTime, formatQepik } from '../engine/formatters';

interface RoleWorkspaceProps {
  lang: Language;
  role: Role;
  onChangeRole: (role: Role) => void;
  state: SimulatorState;
  activeSlot: SlotRecord;
  activeMatch: MatchRecord | null;
  onSelectSlot: (slotId: string) => void;
  onChangeActivePlayer: (userId: string) => void;
  onCreateHold: (quantity: number) => void;
  onSimulateRace: () => void;
  onWebhook: (paymentId: string, outcome: 'SUCCEEDED' | 'FAILED' | 'EXPIRED', duplicate?: boolean) => void;
  onRespondTopUp: (payerId: string, decision: 'ACCEPTED' | 'DECLINED') => void;
  onCancelSeat: (seatId: number) => void;
  onJoinWaitlist: () => void;
  onAcceptWaitlist: (waitlistId: string) => void;
  onSendChat: (text: string) => void;
  onDisputeNoShow: (seatId: number) => void;
  onSubmitRating: (venueRating: number, matchRating: number) => void;
  onVenueExternalBlock: (slotId: string) => void;
  onVenueCancel: (slotId: string, reason: string) => void;
  onVenueToggleUnavailable: (slotId: string) => void;
  onVenueDiscount: (slotId: string, minor: number) => void;
  onVenueQrScan: (seatId: number, method: 'QR_SCAN' | 'MANUAL_ADMIN') => void;
  onVenueAddSlot: () => void;
  onOperatorAdminCancel: (slotId: string) => void;
  onOperatorRetryRefund: (paymentId: string) => void;
  onOperatorFlagDispute: (paymentId: string) => void;
  onOperatorResolveNoShow: (seatId: number, approve: boolean) => void;
}

export const RoleWorkspace: React.FC<RoleWorkspaceProps> = ({
  lang,
  role,
  onChangeRole,
  state,
  activeSlot,
  activeMatch,
  onSelectSlot,
  onChangeActivePlayer,
  onCreateHold,
  onSimulateRace,
  onWebhook,
  onRespondTopUp,
  onCancelSeat,
  onJoinWaitlist,
  onAcceptWaitlist,
  onSendChat,
  onDisputeNoShow,
  onSubmitRating,
  onVenueExternalBlock,
  onVenueCancel,
  onVenueToggleUnavailable,
  onVenueDiscount,
  onVenueQrScan,
  onVenueAddSlot,
  onOperatorAdminCancel,
  onOperatorRetryRefund,
  onOperatorFlagDispute,
  onOperatorResolveNoShow,
}) => {
  const t = TRANSLATIONS[lang];
  const [slotFilter, setSlotFilter] = useState<'all' | 'free' | 'almost'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [quantity, setQuantity] = useState<number>(1);
  const [chatInput, setChatInput] = useState('');
  const [venueCancelReason, setVenueCancelReason] = useState('');
  const [showVenueCancelForm, setShowVenueCancelForm] = useState(false);
  const [venueRating, setVenueRating] = useState(5);
  const [matchRating, setMatchRating] = useState(5);

  const filteredSlots = state.slots.filter((s) => {
    if (districtFilter !== 'all' && s.district !== districtFilter) return false;
    const m = state.matches[s.id];
    const paid = m ? getMatchPaidSeats(m).length : 0;
    if (slotFilter === 'free') return s.status === SlotStatus.FREE;
    if (slotFilter === 'almost') return paid >= 8 && paid < s.capacity;
    return true;
  });

  const pendingPayments = state.payments.filter(
    (p) => p.slotId === activeSlot.id && p.status === PaymentStatus.PENDING_PROVIDER,
  );
  const recentSucceededOrExpired = state.payments.filter(
    (p) =>
      p.slotId === activeSlot.id &&
      (p.status === PaymentStatus.SUCCEEDED || p.status === PaymentStatus.EXPIRED),
  );

  const seatPriceMinor = activeMatch
    ? activeMatch.pricingSnapshot.seatPriceMinor
    : Math.floor(activeSlot.rentMinor / activeSlot.capacity);
  const feePerSeat = activeMatch
    ? activeMatch.pricingSnapshot.playerServiceFeeMinor
    : state.policy.playerServiceFeeMinor;

  const paidSeats = activeMatch ? getMatchPaidSeats(activeMatch) : [];
  const freeSeatsCount = activeMatch
    ? activeMatch.seats.filter((s) => s.seatStatus === SeatStatus.FREE).length
    : activeSlot.capacity;
  const hasReplacementSeat = Boolean(
    activeMatch &&
      activeMatch.seats.some((s) => s.seatStatus === SeatStatus.FREE && s.replacementOpen) &&
      state.clockUtcMs >= activeMatch.cutoffAtUtcMs &&
      state.clockUtcMs < activeMatch.replacementDeadlineUtcMs,
  );

  const chatUnlocked =
    activeMatch &&
    (activeMatch.status === MatchStatus.CONFIRMED ||
      activeMatch.status === MatchStatus.IN_PROGRESS ||
      activeMatch.status === MatchStatus.COMPLETED);
  const chatArchived = Boolean(activeMatch && state.clockUtcMs >= activeMatch.chatArchiveAtUtcMs);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Role Segmented Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onChangeRole('PLAYER')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'PLAYER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t.roles.player}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeRole('VENUE_ADMIN')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'VENUE_ADMIN'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{t.roles.venue}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeRole('OPERATOR')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'OPERATOR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{t.roles.operator}</span>
          </button>
        </div>

        {role === 'PLAYER' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{t.roles.actingAs}:</span>
            <select
              value={state.activePlayerId}
              onChange={(e) => onChangeActivePlayer(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
            >
              {SIM_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · ★{u.skillLevel} ({u.reliabilityScore}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PLAYER / INITIATOR WORKSPACE */}
      {role === 'PLAYER' && (
        <div className="divide-y divide-slate-200">
          {/* 1. Baku Slot Catalog & Filters */}
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.catalogTitle}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded bg-slate-100 p-0.5 text-xs">
                  {(
                    [
                      ['all', t.playerPanel.filterAll],
                      ['free', t.playerPanel.filterFree],
                      ['almost', t.playerPanel.filterAlmostFull],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSlotFilter(key)}
                      className={`rounded px-2.5 py-1 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        slotFilter === key
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  <option value="all">{t.playerPanel.districtAll}</option>
                  <option value="Gənclik">Gənclik</option>
                  <option value="Yasamal">Yasamal</option>
                  <option value="Nərimanov">Nərimanov</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {filteredSlots.map((slot) => {
                const m = state.matches[slot.id];
                const paid = m ? getMatchPaidSeats(m).length : 0;
                const isSelected = slot.id === activeSlot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelectSlot(slot.id)}
                    className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {slot.venueName}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums shrink-0">
                        {formatAzn(Math.floor(slot.rentMinor / slot.capacity))}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {slot.district} · {formatBakuTime(slot.startAtUtcMs)}–{formatBakuTime(slot.endAtUtcMs)} · 5×5
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                      <span className="font-medium text-slate-700">{slot.status}</span>
                      <span className="text-slate-600 tabular-nums">
                        {paid}/{slot.capacity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Booking Checkout & Webhook Gateway */}
          <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {/* Booking & Transparent Pre-Pay Terms */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.bookingTitle}</h3>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs font-medium text-slate-700">
                  {t.playerPanel.seatsToBook}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, freeSeatsCount)}
                    value={Math.min(quantity, Math.max(1, freeSeatsCount))}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-28 accent-emerald-600"
                  />
                  <span className="w-10 text-right font-mono text-xs font-bold tabular-nums text-slate-900">
                    {Math.min(quantity, Math.max(1, freeSeatsCount))}
                  </span>
                  {freeSeatsCount === activeSlot.capacity && (
                    <button
                      type="button"
                      onClick={() => setQuantity(activeSlot.capacity)}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                    >
                      {t.playerPanel.fullPitchBuyout}
                    </button>
                  )}
                </div>
              </div>

              <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t.playerPanel.rentShare}</dt>
                  <dd className="font-mono text-slate-900 tabular-nums">
                    {formatAzn(seatPriceMinor * Math.min(quantity, Math.max(1, freeSeatsCount)))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t.playerPanel.serviceFee}</dt>
                  <dd className="font-mono text-slate-900 tabular-nums">
                    {formatAzn(feePerSeat * Math.min(quantity, Math.max(1, freeSeatsCount)))}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold">
                  <dt className="text-slate-900">{t.playerPanel.totalDue}</dt>
                  <dd className="font-mono text-emerald-700 tabular-nums">
                    {formatAzn((seatPriceMinor + feePerSeat) * Math.min(quantity, Math.max(1, freeSeatsCount)))}
                  </dd>
                </div>
              </dl>

              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                {t.playerPanel.termsNotice}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {hasReplacementSeat ? (
                  <button
                    type="button"
                    onClick={() => onCreateHold(1)}
                    className="rounded-md bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
                  >
                    {t.playerPanel.buyReplacementSeat}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={freeSeatsCount === 0}
                    onClick={() => onCreateHold(Math.min(quantity, Math.max(1, freeSeatsCount)))}
                    className="rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                  >
                    {activeMatch ? t.playerPanel.lockMoreSeats : t.playerPanel.activateAndLock}
                  </button>
                )}

                {freeSeatsCount === 1 && activeMatch && (
                  <button
                    type="button"
                    onClick={onSimulateRace}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{t.playerPanel.simulateRace}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Provider Webhook Simulator */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.webhookPanelTitle}</h3>
              {pendingPayments.length === 0 ? (
                <div className="mt-3 space-y-2.5">
                  <p className="text-xs text-slate-500">{t.playerPanel.pendingHoldInfo}</p>
                  {recentSucceededOrExpired.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-slate-700">
                        {p.id} · {p.status} · {formatAzn(p.amountMinor)}
                      </span>
                      <div className="flex gap-1.5">
                        {p.status === PaymentStatus.SUCCEEDED && (
                          <button
                            type="button"
                            onClick={() => onWebhook(p.id, 'SUCCEEDED', true)}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            {t.playerPanel.webhookDuplicate}
                          </button>
                        )}
                        {p.status === PaymentStatus.EXPIRED && (
                          <button
                            type="button"
                            onClick={() => onWebhook(p.id, 'SUCCEEDED', false)}
                            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
                          >
                            {t.playerPanel.webhookLateAfterExpiry}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {pendingPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="rounded border border-amber-200 bg-amber-50/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-slate-900">
                          {pay.id} · Seats {pay.seatIds.map((id) => `#${id}`).join(',')}
                        </span>
                        <span className="font-semibold text-amber-800 tabular-nums">
                          {formatAzn(pay.amountMinor + pay.serviceFeeMinor)}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onWebhook(pay.id, 'SUCCEEDED')}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t.playerPanel.webhookSuccess}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onWebhook(pay.id, 'FAILED')}
                          className="inline-flex items-center gap-1 rounded border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{t.playerPanel.webhookFail}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. T-6h Top-Up Consents (when active) */}
          {activeMatch && activeMatch.topUpConsents.length > 0 && (
            <div className="p-5 bg-amber-50/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.topUpTitle}</h3>
                  <p className="text-xs text-slate-600">{t.playerPanel.topUpPrompt}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {activeMatch.topUpConsents.map((consent) => (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{consent.payerName}</div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Max: {formatAzn(consent.maxAmountMinor)} ({consent.seatIds.length} seat) ·{' '}
                        {consent.decision}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRespondTopUp(consent.payerId, 'ACCEPTED')}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                          consent.decision === 'ACCEPTED'
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {t.playerPanel.topUpAgree}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRespondTopUp(consent.payerId, 'DECLINED')}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                          consent.decision === 'DECLINED'
                            ? 'bg-rose-600 text-white'
                            : 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                        }`}
                      >
                        {t.playerPanel.topUpDecline}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Cancellations, Waitlist & QR Passes */}
          {activeMatch && (
            <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.mySeatsTitle}</h3>
                {state.clockUtcMs >= activeMatch.cutoffAtUtcMs && (
                  <p className="mt-1 text-[11px] text-amber-700">{t.playerPanel.cancelAfterT4Hint}</p>
                )}
                <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {paidSeats.length === 0 ? (
                    <p className="text-xs text-slate-400">—</p>
                  ) : (
                    paidSeats.map((s) => (
                      <div
                        key={s.seatId}
                        className="flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-semibold text-slate-700 mr-1.5">
                            #{s.seatId}
                          </span>
                          <span className="text-slate-900">{s.attendeeName}</span>
                          {s.qrToken && (
                            <span className="ml-2 font-mono text-[10px] text-emerald-700">
                              {s.qrToken}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.checkinStatus === CheckinStatus.NO_SHOW && (
                            <button
                              type="button"
                              onClick={() => onDisputeNoShow(s.seatId)}
                              className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
                            >
                              {t.playerPanel.disputeNoShow}
                            </button>
                          )}
                          {(activeMatch.status === MatchStatus.OPEN ||
                            activeMatch.status === MatchStatus.TOPUP_OFFER ||
                            activeMatch.status === MatchStatus.FULL_PENDING ||
                            activeMatch.status === MatchStatus.CONFIRMED) && (
                            <button
                              type="button"
                              onClick={() => onCancelSeat(s.seatId)}
                              className="rounded border border-rose-200 bg-white px-2 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              {t.playerPanel.cancelSeat}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Waitlist Queue */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.waitlistTitle}</h3>
                  <button
                    type="button"
                    onClick={onJoinWaitlist}
                    className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    {t.playerPanel.joinWaitlist}
                  </button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {activeMatch.waitlist.length === 0 ? (
                    <p className="text-xs text-slate-500">{t.playerPanel.waitlistEmpty}</p>
                  ) : (
                    activeMatch.waitlist.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-1.5 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-900">{w.userName}</span>
                          <span className="ml-2 font-mono text-[11px] text-slate-500">
                            {w.status}
                            {w.offerExpiresAtUtcMs
                              ? ` (until ${formatBakuTime(w.offerExpiresAtUtcMs)})`
                              : ''}
                          </span>
                        </div>
                        {w.status === 'OFFERED' && (
                          <button
                            type="button"
                            onClick={() => onAcceptWaitlist(w.id)}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            {t.playerPanel.acceptWaitlistOffer}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Temporary Match Chat & Post-Match Ratings */}
          {activeMatch && state.policy.enableV15Features && (
            <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.chatTitle}</h3>
                </div>
                {!chatUnlocked ? (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span>{t.playerPanel.chatLockedHint}</span>
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {chatArchived && (
                      <p className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                        {t.playerPanel.chatArchivedHint}
                      </p>
                    )}
                    <div className="max-h-36 space-y-1.5 overflow-y-auto rounded border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
                      {activeMatch.chatMessages.map((msg) => (
                        <div key={msg.id}>
                          <span className="font-semibold text-slate-800">{msg.senderName}: </span>
                          <span className="text-slate-700">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                    {!chatArchived && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (chatInput.trim()) {
                            onSendChat(chatInput);
                            setChatInput('');
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={t.playerPanel.chatPlaceholder}
                          className="flex-1 rounded border border-slate-200 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          <span>{t.playerPanel.chatSend}</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">{t.playerPanel.ratingsTitle}</h3>
                </div>
                {activeMatch.status !== MatchStatus.COMPLETED ? (
                  <p className="mt-2.5 text-xs text-slate-500">
                    COMPLETED required before submitting dual venue & match ratings.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5">
                        <span className="text-slate-600">Venue:</span>
                        <select
                          value={venueRating}
                          onChange={(e) => setVenueRating(Number(e.target.value))}
                          className="rounded border border-slate-200 px-2 py-1"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <span className="text-slate-600">Game:</span>
                        <select
                          value={matchRating}
                          onChange={(e) => setMatchRating(Number(e.target.value))}
                          className="rounded border border-slate-200 px-2 py-1"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => onSubmitRating(venueRating, matchRating)}
                        className="rounded bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        {t.playerPanel.submitRating}
                      </button>
                    </div>
                    {activeMatch.ratings.map((r) => (
                      <div key={r.id} className="text-[11px] text-slate-600">
                        {r.raterName}: Venue {r.venueRating}★ · Match {r.matchQualityRating}★
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VENUE ADMIN WORKSPACE */}
      {role === 'VENUE_ADMIN' && (
        <div className="divide-y divide-slate-200">
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">{t.venuePanel.calendarTitle}</h3>
              <button
                type="button"
                onClick={onVenueAddSlot}
                className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                + {t.venuePanel.createSlot}
              </button>
            </div>

            <div className="space-y-2.5">
              {state.slots.map((s) => {
                const m = state.matches[s.id];
                const isSelected = s.id === activeSlot.id;
                return (
                  <div
                    key={s.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-xs ${
                      isSelected ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSlot(s.id)}
                      className="text-left cursor-pointer"
                    >
                      <div className="font-bold text-slate-900">
                        {s.venueName} · {s.fieldName}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-600">
                        {formatBakuTime(s.startAtUtcMs)}–{formatBakuTime(s.endAtUtcMs)} · {s.status}
                        {m ? ` · Match ${m.status} (${getMatchPaidSeats(m).length}/10)` : ''}
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onVenueExternalBlock(s.id)}
                        className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        {t.venuePanel.attemptExternalBlock}
                      </button>

                      {m && (
                        <>
                          <button
                            type="button"
                            onClick={() => onVenueDiscount(s.id, 1000)}
                            className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          >
                            {t.venuePanel.applyDiscount} (10 AZN)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSlot(s.id);
                              setShowVenueCancelForm(true);
                            }}
                            className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            {t.venuePanel.cancelByVenue}
                          </button>
                        </>
                      )}

                      {!m && (
                        <button
                          type="button"
                          onClick={() => onVenueToggleUnavailable(s.id)}
                          className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {s.status === SlotStatus.UNAVAILABLE
                            ? t.venuePanel.restoreAvailable
                            : t.venuePanel.markUnavailable}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {showVenueCancelForm && activeMatch && (
              <div className="mt-4 rounded border border-rose-200 bg-rose-50/50 p-4 text-xs">
                <h4 className="font-bold text-rose-900">{t.venuePanel.cancelByVenue}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={venueCancelReason}
                    onChange={(e) => setVenueCancelReason(e.target.value)}
                    placeholder={t.venuePanel.cancelReasonPlaceholder}
                    className="flex-1 min-w-[220px] rounded border border-rose-200 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!venueCancelReason.trim()) return;
                      onVenueCancel(activeSlot.id, venueCancelReason.trim());
                      setVenueCancelReason('');
                      setShowVenueCancelForm(false);
                    }}
                    className="rounded bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 cursor-pointer"
                  >
                    {t.venuePanel.confirmVenueCancel}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Scanner Panel */}
          <div className="p-5">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t.venuePanel.qrScannerTitle}</h3>
            </div>
            {!activeMatch || paidSeats.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No paid seats to scan yet.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {paidSeats.map((s) => (
                  <div
                    key={s.seatId}
                    className="flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        #{s.seatId} · {s.attendeeName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate">
                        {s.qrToken ?? 'QR issues at CONFIRMED'} · {s.checkinStatus}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={!s.qrToken}
                        onClick={() => onVenueQrScan(s.seatId, 'QR_SCAN')}
                        className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                      >
                        {t.venuePanel.scanQrBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => onVenueQrScan(s.seatId, 'MANUAL_ADMIN')}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {t.venuePanel.manualCheckinBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Venue Financial Ledger */}
          <div id="ledger-panel" className="p-5">
            <h3 className="text-sm font-bold text-slate-900">{t.venuePanel.ledgerTitle}</h3>
            {state.payouts.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Payouts are generated upon match completion (COMPLETED). Use Time Machine “Match End (+1h)” to settle.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <th className="px-3 py-2 font-medium">Match</th>
                      <th className="px-3 py-2 font-medium text-right">{t.venuePanel.grossRent}</th>
                      <th className="px-3 py-2 font-medium text-right">{t.venuePanel.platformFee}</th>
                      <th className="px-3 py-2 font-medium text-right">{t.venuePanel.providerFee}</th>
                      <th className="px-3 py-2 font-medium text-right">{t.venuePanel.payableToVenue}</th>
                      <th className="px-3 py-2 font-medium">{t.venuePanel.payoutStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {state.payouts.map((po) => (
                      <tr key={po.id}>
                        <td className="px-3 py-2 text-slate-800">{po.matchId}</td>
                        <td className="px-3 py-2 text-right">{formatAzn(po.grossRentMinor)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          −{formatAzn(po.platformFeeMinor)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          −{formatAzn(po.providerFeeMinor)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                          {formatAzn(po.payableMinor)}
                        </td>
                        <td className="px-3 py-2 font-sans font-medium text-slate-700">{po.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAPOYNA OPERATOR WORKSPACE */}
      {role === 'OPERATOR' && (
        <div className="divide-y divide-slate-200">
          {/* Payments & Refunds Registry */}
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">{t.operatorPanel.paymentsTitle}</h3>
              {activeMatch && (
                <button
                  type="button"
                  onClick={() => onOperatorAdminCancel(activeSlot.id)}
                  className="rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
                >
                  {t.operatorPanel.adminCancelBtn}
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="px-3 py-2 font-medium">ID / Key</th>
                    <th className="px-3 py-2 font-medium">Payer</th>
                    <th className="px-3 py-2 font-medium">Kind</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                    <th className="px-3 py-2 font-medium text-right">Refunded</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                        <div>{p.id}</div>
                        <div className="text-slate-400">{p.idempotencyKey}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-800">{p.payerName}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">{p.kind}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatAzn(p.amountMinor + p.serviceFeeMinor)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-rose-700">
                        {formatAzn(p.refundedMinor)}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold">
                        {p.status}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {(p.status === PaymentStatus.REFUND_REQUESTED || p.stuckRefund) && (
                            <button
                              type="button"
                              onClick={() => onOperatorRetryRefund(p.id)}
                              className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 cursor-pointer"
                            >
                              {t.operatorPanel.retryRefund}
                            </button>
                          )}
                          {p.status === PaymentStatus.SUCCEEDED && (
                            <button
                              type="button"
                              onClick={() => onOperatorFlagDispute(p.id)}
                              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              {t.operatorPanel.flagDispute}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NO_SHOW Disputes */}
          {activeMatch && (
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900">{t.operatorPanel.disputesTitle}</h3>
              {activeMatch.seats.filter((s) => s.checkinStatus === CheckinStatus.DISPUTED).length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No open NO_SHOW disputes.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeMatch.seats
                    .filter((s) => s.checkinStatus === CheckinStatus.DISPUTED)
                    .map((s) => (
                      <div
                        key={s.seatId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Seat #{s.seatId} · {s.attendeeName}
                          </div>
                          <div className="text-slate-600">{s.disputeNote}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOperatorResolveNoShow(s.seatId, true)}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                          >
                            {t.operatorPanel.approveDispute}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOperatorResolveNoShow(s.seatId, false)}
                            className="rounded border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 cursor-pointer"
                          >
                            {t.operatorPanel.rejectDispute}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Venue Financial Summary also accessible here */}
          <div className="p-5 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {formatQepik(
                state.payments
                  .filter((p) => p.status === PaymentStatus.SUCCEEDED)
                  .reduce((a, p) => a + p.amountMinor, 0),
                lang,
              )}
            </span>{' '}
            settled across {state.payments.length} payment records.
          </div>
        </div>
      )}
    </div>
  );
};
