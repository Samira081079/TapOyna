import React from 'react';
import { CheckCircle2, Clock, CircleDashed, XCircle, QrCode, AlertTriangle } from 'lucide-react';
import {
  CheckinStatus,
  Language,
  MatchRecord,
  SeatRecord,
  SeatStatus,
  SlotRecord,
} from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';
import { formatAzn, formatDurationCompact, formatQepik } from '../engine/formatters';

interface PitchRosterProps {
  lang: Language;
  clockUtcMs: number;
  slot: SlotRecord;
  match: MatchRecord | null;
}

const PITCH_POSITIONS: { seatId: number; x: number; y: number; label: string }[] = [
  // Team A (left half)
  { seatId: 1, x: 12, y: 50, label: 'GK' },
  { seatId: 2, x: 26, y: 24, label: 'DF' },
  { seatId: 3, x: 26, y: 76, label: 'DF' },
  { seatId: 4, x: 40, y: 34, label: 'FW' },
  { seatId: 5, x: 40, y: 66, label: 'FW' },
  // Team B (right half)
  { seatId: 6, x: 88, y: 50, label: 'GK' },
  { seatId: 7, x: 74, y: 24, label: 'DF' },
  { seatId: 8, x: 74, y: 76, label: 'DF' },
  { seatId: 9, x: 60, y: 34, label: 'FW' },
  { seatId: 10, x: 60, y: 66, label: 'FW' },
];

export const PitchRoster: React.FC<PitchRosterProps> = ({
  lang,
  clockUtcMs,
  slot,
  match,
}) => {
  const t = TRANSLATIONS[lang];

  const seats: SeatRecord[] = match
    ? match.seats
    : Array.from({ length: slot.capacity }, (_, idx) => ({
        seatId: idx + 1,
        matchId: 'preview',
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

  const paidCount = seats.filter((s) => s.seatStatus === SeatStatus.PAID).length;
  const holdCount = seats.filter((s) => s.seatStatus === SeatStatus.HOLD).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t.pitch.title}</h2>
          <p className="text-xs text-slate-500">
            {slot.venueName} · {slot.fieldName} · {slot.district}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
          <span>
            {t.pitch.occupiedOf}:{' '}
            <strong className="font-mono text-slate-900">
              {paidCount}/{slot.capacity}
            </strong>
            {holdCount > 0 && (
              <span className="ml-1 text-amber-700 font-medium">(+{holdCount} HOLD)</span>
            )}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>
            {t.pitch.minRequired}:{' '}
            <strong className="font-mono text-slate-900">
              {match?.minPlayers ?? 8}/{slot.capacity}
            </strong>
          </span>
        </div>
      </div>

      {/* Tactical 5x5 Pitch Formation Visualizer */}
      <div className="border-b border-slate-200 bg-emerald-50/40 px-5 py-4">
        <div className="relative mx-auto h-40 w-full max-w-2xl overflow-hidden rounded-md border border-emerald-200 bg-emerald-50/70">
          {/* Pitch SVG lines */}
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full pointer-events-none"
          >
            <line x1="50" y1="0" x2="50" y2="50" stroke="#A7F3D0" strokeWidth="0.6" />
            <circle cx="50" cy="25" r="7" fill="none" stroke="#A7F3D0" strokeWidth="0.6" />
            <rect x="0" y="13" width="10" height="24" fill="none" stroke="#A7F3D0" strokeWidth="0.6" />
            <rect x="90" y="13" width="10" height="24" fill="none" stroke="#A7F3D0" strokeWidth="0.6" />
          </svg>

          {PITCH_POSITIONS.map((pos) => {
            const seat = seats.find((s) => s.seatId === pos.seatId)!;
            let nodeClasses = 'border-slate-300 bg-white text-slate-500';
            if (seat.seatStatus === SeatStatus.PAID) {
              nodeClasses =
                seat.checkinStatus === CheckinStatus.CHECKED_IN
                  ? 'border-emerald-700 bg-emerald-600 text-white'
                  : 'border-emerald-500 bg-emerald-100 text-emerald-900';
            } else if (seat.seatStatus === SeatStatus.HOLD) {
              nodeClasses = 'border-amber-400 bg-amber-100 text-amber-900';
            } else if (seat.seatStatus === SeatStatus.CANCELLED) {
              nodeClasses = 'border-rose-300 bg-rose-50 text-rose-700';
            }

            return (
              <div
                key={pos.seatId}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                title={seat.attendeeName ?? `Seat #${pos.seatId}`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px] font-bold tabular-nums transition-colors ${nodeClasses}`}
                >
                  {pos.seatId}
                </div>
                <span className="mt-0.5 max-w-[78px] truncate text-[10px] font-medium text-slate-700">
                  {seat.attendeeName ? seat.attendeeName.split(' ')[0] : pos.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact 10-Seat Financial & Status Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
              <th className="px-4 py-2.5 font-medium">{t.pitch.seatHeader}</th>
              <th className="px-4 py-2.5 font-medium">{t.pitch.participantHeader}</th>
              <th className="px-4 py-2.5 font-medium">{t.pitch.statusHeader}</th>
              <th className="px-4 py-2.5 font-medium text-right">{t.pitch.paymentHeader}</th>
              <th className="px-4 py-2.5 font-medium">{t.pitch.checkinHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {seats.map((seat) => {
              const totalMinor = seat.paidBaseMinor + seat.paidTopUpMinor;
              const holdRemaining =
                seat.seatStatus === SeatStatus.HOLD && seat.holdExpiresAtUtcMs
                  ? Math.max(0, seat.holdExpiresAtUtcMs - clockUtcMs)
                  : null;

              return (
                <tr key={seat.seatId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2 font-mono font-semibold text-slate-700 tabular-nums">
                    #{String(seat.seatId).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-2 text-slate-800">
                    {seat.attendeeName ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{seat.attendeeName}</span>
                        {seat.isGuest && (
                          <span className="text-[11px] text-slate-500">
                            · {t.pitch.guestLabel}
                          </span>
                        )}
                      </div>
                    ) : seat.replacementOpen ? (
                      <span className="text-sky-700 font-medium">{t.pitch.openReplacement}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {seat.seatStatus === SeatStatus.PAID && (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.seatPaid}</span>
                      </span>
                    )}
                    {seat.seatStatus === SeatStatus.HOLD && (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700 tabular-nums">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t.pitch.seatHold}
                          {holdRemaining !== null && ` (${formatDurationCompact(holdRemaining, lang)})`}
                        </span>
                      </span>
                    )}
                    {seat.seatStatus === SeatStatus.FREE && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <CircleDashed className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.seatFree}</span>
                      </span>
                    )}
                    {seat.seatStatus === SeatStatus.CANCELLED && (
                      <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.seatCancelled}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-900">
                    {totalMinor > 0 ? (
                      <div>
                        <span>{formatAzn(totalMinor)}</span>
                        <span className="ml-1.5 text-[11px] text-slate-400">
                          ({formatQepik(totalMinor, lang)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">0.00 AZN</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {seat.checkinStatus === CheckinStatus.CHECKED_IN ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <QrCode className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.checkinDone}</span>
                      </span>
                    ) : seat.checkinStatus === CheckinStatus.NO_SHOW ? (
                      <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.checkinNoShow}</span>
                      </span>
                    ) : seat.checkinStatus === CheckinStatus.DISPUTED ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.pitch.checkinDisputed}</span>
                      </span>
                    ) : seat.qrToken ? (
                      <span className="font-mono text-[11px] text-slate-600">{seat.qrToken}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
