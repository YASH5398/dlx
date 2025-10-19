import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { submitServiceRequest } from '../utils/serviceRequests';
import { logActivity } from '../utils/activity';
import { notifyAdminNewServiceRequest } from '../utils/notifications';
import { getServiceFormConfig, subscribeServiceFormConfig } from '../utils/services';
import type { StepDef } from '../utils/services';
import type { FieldDef, FieldType } from '../utils/services';

// Config: Dynamic forms per service

type Props = {
  open: boolean;
  onClose: () => void;
  serviceName: string;
};

export default function ServiceRequestModal({ open, onClose, serviceName }: Props) {
  const { user } = useUser();
  const [steps, setSteps] = useState<StepDef[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Load dynamic form config with realtime updates, fallback to defaults
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const init = async () => {
      const cfg = await getServiceFormConfig(serviceName);
      if (cfg && Array.isArray(cfg) && cfg.length) {
        setSteps(cfg);
      } else {
        // Optionally, handle the case where no config is found for the service
        // For now, we'll just set an empty array or show an error
        setSteps([]);
      }
      unsub = subscribeServiceFormConfig(serviceName, (next) => {
        if (next && next.length) {
          setSteps(next);
        }
      });
    };
    init();
    return () => { if (unsub) try { unsub(); } catch {} };
  }, [serviceName]);

  // Draft autosave
  const draftKey = useMemo(() => user ? `serviceFormDraft:${user.id}:${serviceName}` : `serviceFormDraft::${serviceName}`, [user?.id, serviceName]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAnswers(parsed.answers || {});
        setStepIndex(parsed.stepIndex || 0);
      }
    } catch {}
  }, [draftKey]);
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ stepIndex, answers }));
  }, [stepIndex, answers, draftKey]);

  const totalSteps = steps.length;
  const progressPct = Math.round(((stepIndex + 1) / Math.max(1, totalSteps)) * 100);

  const validateCurrentStep = (): boolean => {
    const current = steps[stepIndex];
    if (!current) return false;
    const nextErrors: Record<string, string> = {};
    for (const f of current.fields) {
      const val = answers[f.name];
      if (f.required && (val === undefined || val === '' || (f.type === 'number' && (val === null || Number.isNaN(Number(val)))))) {
        nextErrors[f.name] = 'This field is required';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  };
  const handlePrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    if (!validateCurrentStep() || !user) return;
    try {
      setSubmitting(true);
      const id = await submitServiceRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        serviceName,
        steps,
        answers,
      });
      await logActivity(user.id, 'service_request_submitted', { id, serviceName });
      try {
        document.dispatchEvent(
          new CustomEvent('notifications:add', {
            detail: { type: 'service', message: `Service request submitted: ${serviceName}`, meta: { id, serviceName } },
          })
        );
      } catch {}
      await notifyAdminNewServiceRequest({ id, serviceName, userId: user.id, userName: user.name });
      setSubmittedId(id);
      localStorage.removeItem(draftKey);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-x-0 top-10 mx-auto w-[95%] max-w-2xl rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-bold"><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Request: {serviceName}</span></h3>
            <p className="text-sm text-gray-300">Step {stepIndex + 1} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white/80 hover:text-white">Close</button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-1 text-xs text-gray-400">{progressPct}% complete</div>
        </div>

        {/* Step Content */}
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-white">{steps[stepIndex]?.title}</h4>
          {steps[stepIndex]?.fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <label className="text-sm text-gray-300">
                {f.label}{f.required && <span className="text-pink-400"> *</span>}
              </label>
              {f.type === 'text' && (
                <input
                  type="text"
                  value={answers[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              )}
              {f.type === 'number' && (
                <input
                  type="number"
                  value={answers[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              )}
              {f.type === 'textarea' && (
                <textarea
                  value={answers[f.name] ?? ''}
                  placeholder={f.placeholder}
                  rows={3}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              )}
              {f.type === 'select' && (
                <select
                  value={answers[f.name] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
                >
                  <option value="">Select...</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {errors[f.name] && <div className="text-xs text-pink-300">{errors[f.name]}</div>}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={handlePrev} disabled={stepIndex === 0} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 disabled:opacity-50">Previous</button>
          {stepIndex < totalSteps - 1 ? (
            <button onClick={handleNext} className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>

        {/* Confirmation */}
        {submittedId && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-gray-300">Your request has been submitted successfully.</p>
            <p className="text-xs text-gray-400 mt-1">Reference ID: {submittedId}</p>
            <div className="mt-3 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}