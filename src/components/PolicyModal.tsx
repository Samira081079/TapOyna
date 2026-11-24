import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Language, PolicyConfig } from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';

interface PolicyModalProps {
  lang: Language;
  policy: PolicyConfig;
  isOpen: boolean;
  onClose: () => void;
  onApply: (updated: PolicyConfig) => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  lang,
  policy,
  isOpen,
  onClose,
  onApply,
}) => {
  const t = TRANSLATIONS[lang];
  const [draft, setDraft] = useState<PolicyConfig>(policy);

  if (!isOpen) return null;

  const updateNum = (key: keyof PolicyConfig, val: number) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const updateBool = (key: keyof PolicyConfig, val: boolean) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.policy.title}</h2>
            <p className="text-xs text-slate-500">{t.policy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 text-sm">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">D01 · Cutoff T–Hours (default 4h)</span>
            <input
              type="number"
              min={1}
              max={12}
              value={draft.cutoffHours}
              onChange={(e) => updateNum('cutoffHours', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D01 · Top-Up Prompt T–Hours (default 6h)</span>
            <input
              type="number"
              min={2}
              max={24}
              value={draft.topUpOfferHours}
              onChange={(e) => updateNum('topUpOfferHours', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D02 · Min Players 5×5 (default 8)</span>
            <input
              type="number"
              min={6}
              max={10}
              value={draft.minPlayers}
              onChange={(e) => updateNum('minPlayers', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Hold TTL Minutes (default 10m)</span>
            <input
              type="number"
              min={2}
              max={30}
              value={draft.holdTtlMinutes}
              onChange={(e) => updateNum('holdTtlMinutes', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D06 · Platform Fee % (default 10%)</span>
            <input
              type="number"
              min={0}
              max={30}
              value={draft.platformFeePct}
              onChange={(e) => updateNum('platformFeePct', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D06 · Provider Acquiring % (default 2%)</span>
            <input
              type="number"
              min={0}
              max={10}
              value={draft.providerFeePct}
              onChange={(e) => updateNum('providerFeePct', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D06 · Player Service Fee (qəpik/seat)</span>
            <input
              type="number"
              min={0}
              max={500}
              step={10}
              value={draft.playerServiceFeeMinor}
              onChange={(e) => updateNum('playerServiceFeeMinor', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">D08 · Replacement Cutoff T–Min (default 30m)</span>
            <input
              type="number"
              min={10}
              max={120}
              value={draft.replacementDeadlineMinutes}
              onChange={(e) => updateNum('replacementDeadlineMinutes', Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-1.5 font-mono text-sm tabular-nums"
            />
          </label>

          <label className="flex items-center gap-2.5 sm:col-span-2 pt-2">
            <input
              type="checkbox"
              checked={draft.requireAllTopUpConsents}
              onChange={(e) => updateBool('requireAllTopUpConsents', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span className="text-xs text-slate-700">
              D03 · Require explicit top-up consent from all paid participants before confirming underfilled match
            </span>
          </label>

          <label className="flex items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.protectSoftReserve}
              onChange={(e) => updateBool('protectSoftReserve', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span className="text-xs text-slate-700">
              D05 · Protect SOFT_RESERVED from silent external venue booking (require CANCEL_BY_VENUE)
            </span>
          </label>

          <label className="flex items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.enableV15Features}
              onChange={(e) => updateBool('enableV15Features', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span className="text-xs text-slate-700">
              D09 · Enable v1.5 features (Waitlist auto-offers, Match Chat, Single-use QR Check-in)
            </span>
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-3.5">
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            {t.policy.saveClose}
          </button>
        </div>
      </div>
    </div>
  );
};
