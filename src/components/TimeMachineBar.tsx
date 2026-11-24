import React from 'react';
import { Clock, FastForward, ShieldCheck, AlertTriangle } from 'lucide-react';
import { InvariantCheck, Language, MatchRecord, PolicyConfig, SlotRecord } from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';
import { formatBakuDateTime, formatBakuTime, formatUtcTime } from '../engine/formatters';

interface TimeMachineBarProps {
  lang: Language;
  clockUtcMs: number;
  slot: SlotRecord;
  match: MatchRecord | null;
  policy: PolicyConfig;
  invariants: InvariantCheck[];
  onAdvanceTo: (targetUtcMs: number) => void;
}

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

export const TimeMachineBar: React.FC<TimeMachineBarProps> = ({
  lang,
  clockUtcMs,
  slot,
  match,
  policy,
  invariants,
  onAdvanceTo,
}) => {
  const t = TRANSLATIONS[lang];

  const t6Ms = slot.startAtUtcMs - policy.topUpOfferHours * HOUR_MS;
  const t4Ms = slot.startAtUtcMs - policy.cutoffHours * HOUR_MS;
  const t30mMs = slot.startAtUtcMs - policy.replacementDeadlineMinutes * MIN_MS;
  const kickoffMs = slot.startAtUtcMs;
  const endMs = slot.endAtUtcMs;
  const archiveMs = slot.endAtUtcMs + 24 * HOUR_MS;

  let phaseLabel = t.timeMachine.phaseBeforeT6;
  if (clockUtcMs >= archiveMs) phaseLabel = t.timeMachine.phaseArchived;
  else if (clockUtcMs >= endMs) phaseLabel = t.timeMachine.phasePostMatch;
  else if (clockUtcMs >= kickoffMs) phaseLabel = t.timeMachine.phaseInProgress;
  else if (clockUtcMs >= t4Ms) phaseLabel = t.timeMachine.phaseT4ToT0;
  else if (clockUtcMs >= t6Ms) phaseLabel = t.timeMachine.phaseT6ToT4;

  const passedCount = invariants.filter((i) => i.passed).length;
  const allPassed = passedCount === invariants.length;

  const activeHoldExpiry = match?.seats
    .filter((s) => s.holdExpiresAtUtcMs !== null)
    .map((s) => s.holdExpiresAtUtcMs as number)
    .sort((a, b) => a - b)[0];

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Dual Clock & Explicit Cutoff Readout */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {formatBakuDateTime(clockUtcMs)} Asia/Baku
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {formatUtcTime(clockUtcMs)}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {phaseLabel}
                  <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
                  <span className="font-medium text-slate-800">
                    {t.timeMachine.freeCancelUntil} {formatBakuTime(t4Ms)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              {allPassed ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className={allPassed ? 'text-emerald-700' : 'text-rose-700'}>
                {passedCount}/{invariants.length} Invariants OK
              </span>
            </div>
          </div>

          {/* Time Machine Jump Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAdvanceTo(clockUtcMs + 5 * MIN_MS)}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FastForward className="h-3 w-3 text-slate-500" />
              <span>{t.timeMachine.jumpPlus5m}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onAdvanceTo(
                  activeHoldExpiry
                    ? activeHoldExpiry + 1000
                    : clockUtcMs + (policy.holdTtlMinutes + 1) * MIN_MS,
                )
              }
              className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpExpireHold}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= t6Ms}
              onClick={() => onAdvanceTo(t6Ms)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpT6}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= t4Ms}
              onClick={() => onAdvanceTo(t4Ms)}
              className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpT4}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= t30mMs}
              onClick={() => onAdvanceTo(t30mMs)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpT30m}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= kickoffMs}
              onClick={() => onAdvanceTo(kickoffMs)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpKickoff}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= endMs}
              onClick={() => onAdvanceTo(endMs)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpEnd}
            </button>

            <button
              type="button"
              disabled={clockUtcMs >= archiveMs}
              onClick={() => onAdvanceTo(archiveMs)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.timeMachine.jumpArchive}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
