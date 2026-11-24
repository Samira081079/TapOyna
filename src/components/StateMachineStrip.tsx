import React from 'react';
import { ArrowRight, CheckCircle2, Circle, AlertCircle, Lock, Ban } from 'lucide-react';
import { Language, MatchRecord, MatchStatus, SlotRecord, SlotStatus } from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';

interface StateMachineStripProps {
  lang: Language;
  slot: SlotRecord;
  match: MatchRecord | null;
}

const SLOT_HAPPY_PATH: SlotStatus[] = [
  SlotStatus.FREE,
  SlotStatus.PAYMENT_LOCK,
  SlotStatus.SOFT_RESERVED,
  SlotStatus.HARD_RESERVED,
  SlotStatus.COMPLETED,
];

const MATCH_HAPPY_PATH: MatchStatus[] = [
  MatchStatus.OPEN,
  MatchStatus.TOPUP_OFFER,
  MatchStatus.FULL_PENDING,
  MatchStatus.CONFIRMED,
  MatchStatus.IN_PROGRESS,
  MatchStatus.COMPLETED,
];

function getNodeStyle(isActive: boolean, isErrorBranch: boolean) {
  if (isActive && isErrorBranch) {
    return 'border-rose-300 bg-rose-50 text-rose-800 font-semibold';
  }
  if (isActive) {
    return 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
  }
  return 'border-slate-200 bg-white text-slate-500';
}

export const StateMachineStrip: React.FC<StateMachineStripProps> = ({ lang, slot, match }) => {
  const t = TRANSLATIONS[lang];
  const slotBranchActive =
    slot.status === SlotStatus.BLOCKED_EXTERNAL || slot.status === SlotStatus.UNAVAILABLE;

  const matchCancelledActive =
    match &&
    (match.status === MatchStatus.CANCELLED_UNDERFILLED ||
      match.status === MatchStatus.CANCELLED_VENUE ||
      match.status === MatchStatus.CANCELLED_ADMIN);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Slot State Machine */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">{t.stateMachine.slotLifecycle}</span>
            <span className="font-mono font-medium text-slate-900">
              {slot.venueName} · {slot.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {SLOT_HAPPY_PATH.map((st, idx) => {
              const isActive = slot.status === st;
              return (
                <React.Fragment key={st}>
                  <div
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] whitespace-nowrap ${getNodeStyle(
                      isActive,
                      false,
                    )}`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                    )}
                    <span>{st}</span>
                  </div>
                  {idx < SLOT_HAPPY_PATH.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
            {slotBranchActive && (
              <div
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] whitespace-nowrap ${getNodeStyle(
                  true,
                  true,
                )}`}
              >
                <Lock className="h-3 w-3 text-rose-600 shrink-0" />
                <span>{slot.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match State Machine */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">{t.stateMachine.matchLifecycle}</span>
            <span className="font-mono font-medium text-slate-900">
              {match ? `${match.id} · ${match.status}` : 'NO_MATCH (Slot FREE)'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {MATCH_HAPPY_PATH.map((mst, idx) => {
              const isActive = match?.status === mst;
              return (
                <React.Fragment key={mst}>
                  <div
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] whitespace-nowrap ${getNodeStyle(
                      Boolean(isActive),
                      false,
                    )}`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                    )}
                    <span>{mst}</span>
                  </div>
                  {idx < MATCH_HAPPY_PATH.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
            {matchCancelledActive && match && (
              <div
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] whitespace-nowrap ${getNodeStyle(
                  true,
                  true,
                )}`}
              >
                {match.status === MatchStatus.CANCELLED_VENUE ? (
                  <Ban className="h-3 w-3 text-rose-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
                )}
                <span>{match.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
