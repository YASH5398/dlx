import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { logActivity } from '../utils/activity';
import { notifyAdminNewServiceRequest } from '../utils/notifications';
import { getServiceFormConfig, subscribeServiceFormConfig } from '../utils/services';
import type { StepDef } from '../utils/services';
import type { FieldDef } from '../utils/services';
import { createUserServiceRequest, linkOrderToRequest } from '../utils/serviceRequestsFirestore';
import { createPendingOrderFromRequest } from '../utils/ordersFirestore';
import { DEFAULT_SERVICE_FORMS } from '../utils/serviceFormDefaults';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceName: string;
};

export default function ServiceRequestModal({ open, onClose, serviceName }: Props) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<StepDef[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Define 7-step structure: 1 user info, 5 service-specific, 1 verification
  const uiSteps = useMemo(() => {
    const userInfoStep: StepDef = {
      title: 'Your Information',
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
        { name: 'emailId', label: 'Email Address', type: 'email', required: true },
      ],
    };
    // Use admin-defined service steps as-is; ensure we have exactly 5 steps
    const base = Array.isArray(steps) ? [...steps] : [];
    const serviceSteps: StepDef[] = base.slice(0, 5);
    while (serviceSteps.length < 5) {
      const idx = serviceSteps.length + 1;
      serviceSteps.push({
        title: `Service Details ${idx}`,
        fields: [{ name: `additionalNotes${idx}`, label: 'Additional Notes', type: 'textarea' }],
      });
    }
    return [userInfoStep, ...serviceSteps, { title: 'Verify All Details', fields: [] }];
  }, [steps]);

  // Prefill user info
  useEffect(() => {
    if (user) {
      setAnswers((a) => ({
        ...a,
        fullName: a.fullName ?? user.name,
        emailId: a.emailId ?? user.email,
      }));
    }
  }, [user]);

  // Load dynamic form config with realtime updates
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const init = async () => {
      const cfg = await getServiceFormConfig(serviceName);
      if (cfg && Array.isArray(cfg) && cfg.length) {
        setSteps(cfg);
      } else {
        const fallback = DEFAULT_SERVICE_FORMS[serviceName] || [];
        setSteps(fallback);
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
  const draftKey = useMemo(() => 
    user ? `serviceFormDraft:${user.id}:${serviceName}` : `serviceFormDraft::${serviceName}`, 
    [user?.id, serviceName]
  );
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

  const totalSteps = uiSteps.length;
  const progressPct = Math.round(((stepIndex + 1) / Math.max(1, totalSteps)) * 100);

  const validateCurrentStep = (): boolean => {
    const current = uiSteps[stepIndex];
    if (!current) return false;
    if (current.title === 'Verify All Details') {
      setErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const f of current.fields) {
      const val = answers[f.name];
      if (f.required && (val === undefined || val === '' || 
        (f.type === 'number' && (val === null || Number.isNaN(Number(val)))) || 
        (f.type === 'checkbox' && (!Array.isArray(val) || (val as any[]).length === 0)) ||
        (f.type === 'array' && (!Array.isArray(val) || (val as any[]).filter(Boolean).length === 0))
      )) {
        nextErrors[f.name] = 'This field is required';
      }
      // Require companion detail when 'Other' is selected
      if (f.type === 'select' && val === 'Other' && f.required) {
        const otherVal = answers[`${f.name}__other`];
        if (!otherVal || String(otherVal).trim() === '') {
          nextErrors[`${f.name}__other`] = 'Please specify other';
        }
      }
      if (f.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        nextErrors[f.name] = 'Invalid email address';
      }
      if (f.type === 'tel' && val && !/^\+?[\d\s-]{10,}$/.test(val)) {
        nextErrors[f.name] = 'Invalid phone number';
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

  const handleEditStep = (index: number) => {
    setStepIndex(index);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep() || !user) return;
    try {
      setSubmitting(true);
      const id = await createUserServiceRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        serviceId: serviceName,
        serviceTitle: serviceName,
        requestDetails: JSON.stringify({ steps: uiSteps, answers }),
        userWebsiteLink: '',
        userPassword: '',
        expectedCompletion: '',
      });
      const orderId = await createPendingOrderFromRequest({
        userId: user.id,
        userEmail: user.email,
        serviceTitle: serviceName,
        requestId: id,
      });
      await linkOrderToRequest(id, orderId);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto scroll-smooth">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-white/20 p-6 shadow-2xl shadow-purple-500/20 backdrop-blur-lg max-h-[85vh] overflow-y-auto scroll-smooth">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Request: {serviceName}
            </h3>
            <p className="text-sm text-gray-300">Step {stepIndex + 1} of {totalSteps}</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-300" 
              style={{ width: `${progressPct}%` }} 
            />
          </div>
          <div className="mt-1 text-xs text-gray-300">{progressPct}% complete</div>
        </div>

        {/* Step Content */}
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-white">{uiSteps[stepIndex]?.title}</h4>
          {uiSteps[stepIndex]?.title === 'Verify All Details' ? (
            <div className="space-y-3">
              {uiSteps.filter((s) => s.title !== 'Verify All Details').map((s, idx) => (
                <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold text-white">{idx + 1}. {s.title}</div>
                    <button 
                      onClick={() => handleEditStep(idx)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {s.fields.map((f) => (
                      <div key={f.name} className="text-xs text-gray-300">
                        <span className="text-gray-400">{f.label}: </span>
                        <span className="text-white/90 break-all">{Array.isArray(answers[f.name]) ? (answers[f.name] as any[]).filter(Boolean).join(', ') : String(answers[f.name] ?? '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {uiSteps[stepIndex]?.fields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="text-sm text-gray-200">
                    {f.label}{f.required && <span className="text-pink-400"> *</span>}
                  </label>
                  {f.type === 'text' || f.type === 'email' || f.type === 'tel' ? (
                    <input
                      type={f.type}
                      value={answers[f.name] ?? ''}
                      placeholder={f.placeholder || `Enter ${f.label}`}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                    />
                  ) : f.type === 'number' ? (
                    <input
                      type="number"
                      value={answers[f.name] ?? ''}
                      placeholder={f.placeholder || `Enter ${f.label}`}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                    />
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={answers[f.name] ?? ''}
                      placeholder={f.placeholder || `Enter ${f.label}`}
                      rows={3}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                    />
                  ) : f.type === 'select' ? (
                    <>
                      <select
                        value={answers[f.name] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                      >
                        <option value="" className="bg-gray-800">Select...</option>
                        {(f.options || []).map((opt) => (
                          <option key={opt} value={opt} className="bg-gray-800">{opt}</option>
                        ))}
                      </select>
                      {(answers[f.name] ?? '') === 'Other' && (
                        <input
                          type="text"
                          value={answers[`${f.name}__other`] ?? ''}
                          onChange={(e) => setAnswers((a) => ({ ...a, [`${f.name}__other`]: e.target.value }))}
                          placeholder={`Specify other for ${f.label}`}
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                        />
                      )}
                    </>
                  ) : f.type === 'checkbox' ? (
                    <div className="flex flex-wrap gap-2">
                      {(f.options || []).map((opt) => {
                        const current = Array.isArray(answers[f.name]) ? (answers[f.name] as string[]) : [];
                        const checked = current.includes(opt);
                        return (
                          <label key={opt} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setAnswers((a) => {
                                  const arr = Array.isArray(a[f.name]) ? (a[f.name] as string[]) : [];
                                  const next = e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt);
                                  return { ...a, [f.name]: next };
                                });
                              }}
                              className="text-purple-400 focus:ring-purple-400/50"
                            />
                            <span className="text-sm text-gray-200">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : f.type === 'radio' ? (
                    <div className="flex flex-wrap gap-2">
                      {(f.options || []).map((opt) => (
                        <label key={opt} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <input
                            type="radio"
                            name={f.name}
                            checked={(answers[f.name] ?? '') === opt}
                            onChange={() => setAnswers((a) => ({ ...a, [f.name]: opt }))}
                            className="text-purple-400 focus:ring-purple-400/50"
                          />
                          <span className="text-sm text-gray-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : f.type === 'array' ? (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                        {Array.isArray(answers[f.name]) && (answers[f.name] as string[]).length > 0 ? (
                          (answers[f.name] as string[]).map((val: string, idx: number) => (
                            <div key={`${f.name}-${idx}`} className="flex items-center gap-2">
                              <input
                                type={f.itemType || 'text'}
                                value={val}
                                placeholder={f.itemLabel || 'Enter value'}
                                onChange={(e) => setAnswers((a) => {
                                  const arr = Array.isArray(a[f.name]) ? [...(a[f.name] as string[])] : [];
                                  arr[idx] = e.target.value;
                                  return { ...a, [f.name]: arr };
                                })}
                                className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors"
                              />
                              <button
                                onClick={() => setAnswers((a) => {
                                  const arr = Array.isArray(a[f.name]) ? [...(a[f.name] as string[])] : [];
                                  arr.splice(idx, 1);
                                  return { ...a, [f.name]: arr };
                                })}
                                className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400">No entries added yet.</div>
                        )}
                      </div>
                      <button
                        onClick={() => setAnswers((a) => {
                          const arr = Array.isArray(a[f.name]) ? [...(a[f.name] as string[])] : [];
                          arr.push('');
                          return { ...a, [f.name]: arr };
                        })}
                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      >
                        + Add
                      </button>
                    </div>
                  ) : null}
                  {errors[f.name] && <div className="text-xs text-pink-300">{errors[f.name]}</div>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between sticky bottom-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 py-4 -mx-6 px-6">
          <button 
            onClick={handlePrev} 
            disabled={stepIndex === 0} 
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
          >
            Previous
          </button>
          {stepIndex < totalSteps - 1 ? (
            <button 
              onClick={handleNext} 
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white shadow-[0_0_16px_rgba(0,212,255,0.25)] hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-colors"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-[0_0_16px_rgba(0,212,255,0.25)] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>

        {/* Success Popup Overlay - persistent until user closes */}
        {submittedId && (
          <div className="fixed inset-0 z-[70] p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl mx-auto my-8 rounded-2xl shadow-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-white overflow-hidden">
              {/* Header */}
              <div className="absolute top-3 right-3">
                <button onClick={onClose} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">Close</button>
              </div>
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 text-center mb-4">
                  Service Request Submitted Successfully!
                </h3>
                <div className="text-slate-300 text-sm sm:text-base leading-relaxed space-y-2 text-center">
                  <p>Our team will review your request within 12 hours.</p>
                  <p>Once the review is complete, the service cost will appear in your <strong className="text-white">Orders</strong> section.</p>
                  <p>After that, you’ll be able to make the payment to start the work.</p>
                  <p>You can track every update in the <strong className="text-white">Orders</strong> section.</p>
                </div>
                <div className="mt-6 text-center text-xs sm:text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <span>🕒</span>
                    <span>Please wait up to 12 hours for review</span>
                  </span>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Track Order
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}