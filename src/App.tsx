import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  Language,
  MatchStatus,
  PaymentStatus,
  PolicyConfig,
  Role,
  SimulatorState,
  SlotRecord,
  SlotStatus,
  WorkspaceSection,
} from './types/tapoyna';
import { TRANSLATIONS } from './i18n/translations';
import {
  DEFAULT_POLICY,
  advanceClockTo,
  applyVenueDiscount,
  attemptVenueExternalBlock,
  cancelMatchWithFullRefunds,
  cancelSeatParticipation,
  createInitialState,
  createSeatHold,
  disputeNoShow,
  evaluateInvariants,
  getActiveMatch,
  getActiveSlot,
  joinWaitlist,
  acceptWaitlistOffer,
  performQrCheckin,
  processPaymentWebhook,
  resolveNoShowDispute,
  respondTopUpConsent,
  retryStuckRefund,
  sendChatMessage,
  simulateConcurrentLastSeatRace,
  submitMatchRating,
} from './engine/simulator';
import { QA_SCENARIOS } from './engine/qaScenarios';
import { TopBar } from './components/TopBar';
import { TimeMachineBar } from './components/TimeMachineBar';
import { StateMachineStrip } from './components/StateMachineStrip';
import { PitchRoster } from './components/PitchRoster';
import { RoleWorkspace } from './components/RoleWorkspace';
import { TelemetryDeck } from './components/TelemetryDeck';
import { PolicyModal } from './components/PolicyModal';

const STORAGE_KEY = 'tapoyna_sim_state_v1';

function loadInitialState(): SimulatorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SimulatorState;
      if (parsed && Array.isArray(parsed.slots) && parsed.policy) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse failure and fall back to fresh seed
  }
  return createInitialState(DEFAULT_POLICY);
}

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [role, setRole] = useState<Role>('PLAYER');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('sandbox');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [highlightQa, setHighlightQa] = useState(false);
  const [state, setState] = useState<SimulatorState>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = TRANSLATIONS[lang];
  const activeSlot = useMemo(() => getActiveSlot(state), [state]);
  const activeMatch = useMemo(() => getActiveMatch(state), [state]);
  const invariants = useMemo(() => evaluateInvariants(state), [state]);

  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (section === 'policy') {
      setPolicyOpen(true);
      return;
    }
    if (section === 'qa') {
      setHighlightQa(true);
      document.getElementById('qa-suite-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightQa(false), 1800);
      return;
    }
    if (section === 'ledger') {
      setRole('VENUE_ADMIN');
      setTimeout(() => {
        document.getElementById('ledger-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    const fresh = createInitialState(state.policy);
    setState(fresh);
    setRole('PLAYER');
    setActiveSection('sandbox');
  };

  const handleApplyPolicy = (updatedPolicy: PolicyConfig) => {
    setState((prev) => ({
      ...prev,
      policy: updatedPolicy,
      lastNotice: {
        id: `pol-${Date.now()}`,
        tone: 'info',
        text: 'Decision matrix parameters updated. New slots/holds will use updated policy.',
      },
    }));
  };

  const handleRunQaScenario = (testId: string) => {
    const scenario = QA_SCENARIOS.find((q) => q.id === testId);
    if (!scenario) return;
    const nextState = scenario.run(state.policy);
    setState(nextState);
    if (testId === 'AT-11' || testId === 'AT-12') {
      setRole('VENUE_ADMIN');
    } else {
      setRole('PLAYER');
    }
  };

  const handleVenueAddSlot = () => {
    const idx = state.slots.length + 1;
    const baseStart = state.slots[0].startAtUtcMs + idx * 60 * 60 * 1000;
    const newSlot: SlotRecord = {
      id: `slot-baku-${idx}`,
      venueName: 'Xətai Pitch Arena',
      fieldName: `Field #${idx} (5×5)`,
      district: 'Nərimanov',
      format: '5×5',
      capacity: state.policy.capacity,
      startAtUtcMs: baseStart,
      endAtUtcMs: baseStart + 60 * 60 * 1000,
      rentMinor: 10000,
      currency: 'AZN',
      status: SlotStatus.FREE,
      version: 1,
    };
    setState((prev) => ({
      ...prev,
      slots: [...prev.slots, newSlot],
      activeSlotId: newSlot.id,
      lastNotice: {
        id: `add-${Date.now()}`,
        tone: 'success',
        text: `Added FREE slot ${newSlot.venueName} (${newSlot.fieldName}).`,
      },
    }));
  };

  const handleVenueToggleUnavailable = (slotId: string) => {
    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              status:
                s.status === SlotStatus.UNAVAILABLE ? SlotStatus.FREE : SlotStatus.UNAVAILABLE,
              version: s.version + 1,
            }
          : s,
      ),
    }));
  };

  const handleOperatorFlagDispute = (paymentId: string) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId ? { ...p, status: PaymentStatus.DISPUTED } : p,
      ),
      lastNotice: {
        id: `disp-${Date.now()}`,
        tone: 'warning',
        text: `Payment ${paymentId} moved to DISPUTED / CHARGEBACK workflow.`,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        lang={lang}
        onChangeLang={setLang}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onReset={handleReset}
      />

      <TimeMachineBar
        lang={lang}
        clockUtcMs={state.clockUtcMs}
        slot={activeSlot}
        match={activeMatch}
        policy={state.policy}
        invariants={invariants}
        onAdvanceTo={(targetMs) => setState((prev) => advanceClockTo(prev, targetMs))}
      />

      {/* Main Content Container */}
      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-5">
        {/* Compact Hero Context Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">{t.hero.pilotBadge}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t.hero.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t.hero.subtitle}</p>
          </div>
        </div>

        {/* Transient Action Feedback Banner */}
        {state.lastNotice && (
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs ${
              state.lastNotice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : state.lastNotice.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : state.lastNotice.tone === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                    : 'border-sky-200 bg-sky-50 text-sky-900'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {state.lastNotice.tone === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              {state.lastNotice.tone === 'warning' && (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              {state.lastNotice.tone === 'error' && (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              {state.lastNotice.tone === 'info' && (
                <Info className="h-4 w-4 text-sky-600 shrink-0" />
              )}
              <span>{state.lastNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, lastNotice: null }))}
              className="rounded p-1 opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Dual State Machine Strip */}
        <StateMachineStrip lang={lang} slot={activeSlot} match={activeMatch} />

        {/* Two-Zone Sandbox Layout: Left/Center Stage (65%) + Right Telemetry & QA Deck (35%) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          <div className="space-y-5 lg:col-span-8">
            <PitchRoster
              lang={lang}
              clockUtcMs={state.clockUtcMs}
              slot={activeSlot}
              match={activeMatch}
            />

            <RoleWorkspace
              lang={lang}
              role={role}
              onChangeRole={setRole}
              state={state}
              activeSlot={activeSlot}
              activeMatch={activeMatch}
              onSelectSlot={(slotId) => setState((prev) => ({ ...prev, activeSlotId: slotId }))}
              onChangeActivePlayer={(userId) =>
                setState((prev) => ({ ...prev, activePlayerId: userId }))
              }
              onCreateHold={(qty) =>
                setState((prev) =>
                  createSeatHold(prev, {
                    slotId: activeSlot.id,
                    userId: prev.activePlayerId,
                    quantity: qty,
                  }),
                )
              }
              onSimulateRace={() =>
                setState((prev) => simulateConcurrentLastSeatRace(prev, activeSlot.id))
              }
              onWebhook={(paymentId, outcome, duplicate) =>
                setState((prev) => {
                  const targetPayment = prev.payments.find((p) => p.id === paymentId);
                  const existingEvt = duplicate ? targetPayment?.providerEventIds[0] : undefined;
                  return processPaymentWebhook(prev, {
                    paymentId,
                    outcome,
                    providerEventId: existingEvt,
                  });
                })
              }
              onRespondTopUp={(payerId, decision) =>
                setState((prev) =>
                  respondTopUpConsent(prev, { slotId: activeSlot.id, payerId, decision }),
                )
              }
              onCancelSeat={(seatId) =>
                setState((prev) =>
                  cancelSeatParticipation(prev, { slotId: activeSlot.id, seatId }),
                )
              }
              onJoinWaitlist={() =>
                setState((prev) => joinWaitlist(prev, activeSlot.id, prev.activePlayerId))
              }
              onAcceptWaitlist={(waitlistId) =>
                setState((prev) => acceptWaitlistOffer(prev, activeSlot.id, waitlistId))
              }
              onSendChat={(text) =>
                setState((prev) => sendChatMessage(prev, activeSlot.id, text))
              }
              onDisputeNoShow={(seatId) =>
                setState((prev) =>
                  disputeNoShow(prev, activeSlot.id, seatId, 'Player submitted pitch arrival photo.'),
                )
              }
              onSubmitRating={(v, m) =>
                setState((prev) => submitMatchRating(prev, activeSlot.id, v, m))
              }
              onVenueExternalBlock={(slotId) =>
                setState((prev) => attemptVenueExternalBlock(prev, slotId))
              }
              onVenueCancel={(slotId, reason) =>
                setState((prev) =>
                  cancelMatchWithFullRefunds(prev, slotId, MatchStatus.CANCELLED_VENUE, reason),
                )
              }
              onVenueToggleUnavailable={handleVenueToggleUnavailable}
              onVenueDiscount={(slotId, minor) =>
                setState((prev) => applyVenueDiscount(prev, slotId, minor))
              }
              onVenueQrScan={(seatId, method) =>
                setState((prev) => performQrCheckin(prev, { slotId: activeSlot.id, seatId, method }))
              }
              onVenueAddSlot={handleVenueAddSlot}
              onOperatorAdminCancel={(slotId) =>
                setState((prev) =>
                  cancelMatchWithFullRefunds(
                    prev,
                    slotId,
                    MatchStatus.CANCELLED_ADMIN,
                    'Operator administrative cancellation',
                  ),
                )
              }
              onOperatorRetryRefund={(paymentId) =>
                setState((prev) => retryStuckRefund(prev, paymentId))
              }
              onOperatorFlagDispute={handleOperatorFlagDispute}
              onOperatorResolveNoShow={(seatId, approve) =>
                setState((prev) => resolveNoShowDispute(prev, activeSlot.id, seatId, approve))
              }
            />
          </div>

          <div className="lg:col-span-4">
            <TelemetryDeck
              lang={lang}
              state={state}
              slot={activeSlot}
              match={activeMatch}
              highlightQa={highlightQa}
              onRunQaScenario={handleRunQaScenario}
            />
          </div>
        </div>

        {/* Bottom 8-Invariant Verification Matrix */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">{t.operatorPanel.invariantsTitle}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {invariants.map((inv, idx) => (
              <div
                key={inv.id}
                className={`flex items-start gap-2 rounded border p-2.5 text-xs ${
                  inv.passed
                    ? 'border-slate-200 bg-slate-50/60 text-slate-800'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    inv.passed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                />
                <div>
                  <div className="font-mono text-[11px] font-semibold text-slate-500">
                    0{idx + 1} · {inv.detail}
                  </div>
                  <div className="mt-0.5 leading-snug">
                    {t.invariants[inv.labelKey as keyof typeof t.invariants]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PolicyModal
        lang={lang}
        policy={state.policy}
        isOpen={policyOpen}
        onClose={() => {
          setPolicyOpen(false);
          setActiveSection('sandbox');
        }}
        onApply={handleApplyPolicy}
      />
    </div>
  );
}
