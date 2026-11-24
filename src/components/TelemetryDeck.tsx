import React from 'react';
import { CheckCircle2, Play, XCircle, FileClock } from 'lucide-react';
import { Language, MatchRecord, SimulatorState, SlotRecord } from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';
import { computeRentCoverage } from '../engine/simulator';
import { calculateTopUpShares, formatAzn, formatBakuTime, formatQepik } from '../engine/formatters';
import { QA_SCENARIOS } from '../engine/qaScenarios';

interface TelemetryDeckProps {
  lang: Language;
  state: SimulatorState;
  slot: SlotRecord;
  match: MatchRecord | null;
  highlightQa: boolean;
  onRunQaScenario: (testId: string) => void;
}

export const TelemetryDeck: React.FC<TelemetryDeckProps> = ({
  lang,
  state,
  slot,
  match,
  highlightQa,
  onRunQaScenario,
}) => {
  const t = TRANSLATIONS[lang];

  const coverage = match
    ? computeRentCoverage(match)
    : {
        rentMinor: slot.rentMinor,
        basePaidMinor: 0,
        topUpPaidMinor: 0,
        committedTopUpMinor: 0,
        venueDiscountMinor: 0,
        initiatorExtraMinor: 0,
        coveredNowMinor: 0,
        potentialWithConsentsMinor: 0,
        deficitMinor: slot.rentMinor,
        allPaidConsented: false,
      };

  const paidPct = Math.min(
    100,
    Math.round(((coverage.basePaidMinor + coverage.topUpPaidMinor + coverage.venueDiscountMinor) / coverage.rentMinor) * 100),
  );
  const committedPct = Math.min(
    100 - paidPct,
    Math.round((coverage.committedTopUpMinor / coverage.rentMinor) * 100),
  );

  // Deterministic 1 qepik preview if 8 or 9 seats paid
  const paidSeats = match ? match.seats.filter((s) => s.seatStatus === 'PAID') : [];
  const deterministicPreview =
    match && coverage.deficitMinor > 0 && paidSeats.length >= match.minPlayers && paidSeats.length < match.capacity
      ? calculateTopUpShares(
          coverage.deficitMinor,
          paidSeats.map((s) => s.seatId),
        )
      : null;

  return (
    <div className="space-y-4">
      {/* 100 AZN Rent Coverage Meter */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{t.telemetry.coverageTitle}</h3>
          <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
            {formatAzn(coverage.coveredNowMinor)} / {formatAzn(coverage.rentMinor)}
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            style={{ width: `${paidPct}%` }}
            className="bg-emerald-600 transition-all duration-200"
          />
          <div
            style={{ width: `${committedPct}%` }}
            className="bg-amber-400 transition-all duration-200"
          />
        </div>

        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">{t.telemetry.collectedBase}</dt>
            <dd className="font-mono font-medium text-slate-900 tabular-nums">
              {formatAzn(coverage.basePaidMinor + coverage.topUpPaidMinor)} (
              {formatQepik(coverage.basePaidMinor + coverage.topUpPaidMinor, lang)})
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">{t.telemetry.committedTopUp}</dt>
            <dd className="font-mono font-medium text-amber-700 tabular-nums">
              {formatAzn(coverage.committedTopUpMinor)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
            <dt className="font-medium text-slate-700">{t.telemetry.remainingDeficit}</dt>
            <dd
              className={`font-mono font-semibold tabular-nums ${
                coverage.deficitMinor === 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {coverage.deficitMinor === 0
                ? t.telemetry.fullyCovered
                : `${formatAzn(coverage.deficitMinor)} (${formatQepik(coverage.deficitMinor, lang)})`}
            </dd>
          </div>
        </dl>

        {deterministicPreview && (
          <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">
              1 qəpik deterministic split ({paidSeats.length} seats):{' '}
            </span>
            <span className="font-mono tabular-nums">
              {Object.entries(deterministicPreview)
                .map(([sid, amt]) => `#${sid}:${formatAzn(amt)}`)
                .join(' · ')}
            </span>
          </div>
        )}
      </div>

      {/* QA Acceptance Suite (AT-01 .. AT-12) */}
      <div
        id="qa-suite-panel"
        className={`rounded-lg border bg-white p-4 transition-colors ${
          highlightQa ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{t.telemetry.qaSuiteTitle}</h3>
          <span className="font-mono text-xs text-slate-500 tabular-nums">12/12</span>
        </div>

        {state.qaAssertionResult && (
          <div
            className={`mb-3 flex items-start gap-2 rounded border p-2.5 text-xs ${
              state.qaAssertionResult.passed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {state.qaAssertionResult.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            )}
            <div>
              <div className="font-mono font-bold">
                {state.qaAssertionResult.testId} ·{' '}
                {state.qaAssertionResult.passed ? 'PASS' : 'FAIL'}
              </div>
              <p className="mt-0.5">{state.qaAssertionResult.message}</p>
            </div>
          </div>
        )}

        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {QA_SCENARIOS.map((qa) => {
            const isActive = state.activeQaTestId === qa.id;
            return (
              <div
                key={qa.id}
                className={`flex items-start justify-between gap-2 rounded border px-2.5 py-2 text-xs transition-colors ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">
                    <span className="font-mono text-emerald-700 mr-1.5">{qa.id}</span>
                    <span>{qa.title[lang]}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{qa.expected[lang]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRunQaScenario(qa.id)}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="h-3 w-3" />
                  <span>{t.telemetry.runTest}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Event, Webhook & Audit Stream */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileClock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">{t.telemetry.auditLogTitle}</h3>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {state.auditEvents.length}
          </span>
        </div>

        {state.auditEvents.length === 0 ? (
          <p className="text-xs text-slate-500">{t.telemetry.emptyAudit}</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {state.auditEvents.slice(0, 30).map((evt) => (
              <div
                key={evt.id}
                className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-800">
                    {evt.action}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {formatBakuTime(evt.timestampUtcMs)}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {evt.actorName} · {evt.beforeState} →{' '}
                  <span className="font-medium text-slate-800">{evt.afterState}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600">{evt.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
