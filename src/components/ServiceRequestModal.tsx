import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { submitServiceRequest } from '../utils/serviceRequests';
import { logActivity } from '../utils/activity';
import { notifyAdminNewServiceRequest } from '../utils/notifications';

// Field & step types
type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select
}
interface StepDef {
  title: string;
  fields: FieldDef[];
}

// Config: Dynamic forms per service
const SERVICE_FORMS: Record<string, StepDef[]> = {
  'Mobile App Development': [
    {
      title: 'App Basics',
      fields: [
        { name: 'appName', label: 'App Name', type: 'text', required: true, placeholder: 'e.g., DigiPay' },
        { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['iOS', 'Android', 'Both'] },
        { name: 'coreFeatures', label: 'Core Features', type: 'textarea', required: true, placeholder: 'Login, Payments, Notifications...' },
      ],
    },
    {
      title: 'Backend & Framework',
      fields: [
        { name: 'needBackend', label: 'Need Backend?', type: 'select', required: true, options: ['Yes', 'No', 'Unsure'] },
        { name: 'preferredFramework', label: 'Preferred Framework', type: 'select', options: ['React Native', 'Flutter', 'Swift/Kotlin', 'No Preference'], required: true },
      ],
    },
    {
      title: 'Tech & Budget',
      fields: [
        { name: 'techStack', label: 'Tech Stack', type: 'textarea', placeholder: 'Auth, DB, APIs, CI/CD...' },
        { name: 'budgetUsd', label: 'Budget (USD)', type: 'number', required: true, placeholder: 'e.g., 5000' },
      ],
    },
    {
      title: 'Confirm & Summary',
      fields: [
        { name: 'timeline', label: 'Target Timeline (weeks)', type: 'number', placeholder: 'e.g., 6' },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any constraints or references' },
      ],
    },
  ],
  'Website Development': [
    {
      title: 'Project Overview',
      fields: [
        { name: 'siteType', label: 'Site Type', type: 'select', required: true, options: ['Landing Page', 'Corporate', 'E-commerce', 'Web App'] },
        { name: 'pages', label: 'Key Pages', type: 'textarea', required: true, placeholder: 'Home, About, Services, Contact...' },
      ],
    },
    {
      title: 'Tech & CMS',
      fields: [
        { name: 'framework', label: 'Preferred Stack', type: 'select', options: ['React + Vite', 'Next.js', 'Vue', 'No Preference'], required: true },
        { name: 'cms', label: 'CMS Needed?', type: 'select', options: ['Headless (Strapi/Sanity)', 'WordPress', 'None'], required: true },
      ],
    },
    {
      title: 'Design & Budget',
      fields: [
        { name: 'designRefs', label: 'Design References', type: 'textarea', placeholder: 'Links or notes' },
        { name: 'budgetUsd', label: 'Budget (USD)', type: 'number', required: true, placeholder: 'e.g., 3000' },
      ],
    },
    {
      title: 'Confirm & Summary',
      fields: [
        { name: 'timeline', label: 'Target Timeline (weeks)', type: 'number', placeholder: 'e.g., 4' },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any constraints or references' },
      ],
    },
  ],
  'Graphic Design': [
    {
      title: 'Requirements',
      fields: [
        { name: 'scope', label: 'Design Scope', type: 'select', options: ['Logo', 'Brand Kit', 'Banners', 'Social Media'], required: true },
        { name: 'style', label: 'Style Preferences', type: 'textarea', placeholder: 'Minimal, bold, modern...' },
      ],
    },
    {
      title: 'Assets & Budget',
      fields: [
        { name: 'assets', label: 'Existing Assets', type: 'textarea', placeholder: 'Logos, colors, fonts' },
        { name: 'budgetUsd', label: 'Budget (USD)', type: 'number', required: true },
      ],
    },
    {
      title: 'Confirm',
      fields: [
        { name: 'timeline', label: 'Target Timeline (weeks)', type: 'number' },
        { name: 'notes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
  ],
  'Marketing Services': [
    {
      title: 'Goal & Channels',
      fields: [
        { name: 'goal', label: 'Primary Goal', type: 'select', options: ['Leads', 'Sales', 'Brand Awareness'], required: true },
        { name: 'channels', label: 'Channels', type: 'textarea', placeholder: 'SEO, PPC, Social, Email' },
      ],
    },
    {
      title: 'Budget & Timeline',
      fields: [
        { name: 'budgetUsd', label: 'Budget (USD)', type: 'number', required: true },
        { name: 'timeline', label: 'Target Timeline (weeks)', type: 'number' },
      ],
    },
    {
      title: 'Confirm',
      fields: [
        { name: 'notes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
  ],
};

// Fallback generic form for other services
function getFormSteps(serviceName: string): StepDef[] {
  if (SERVICE_FORMS[serviceName]) return SERVICE_FORMS[serviceName];
  return [
    { title: 'Overview', fields: [ { name: 'summary', label: 'Brief Summary', type: 'textarea', required: true } ] },
    { title: 'Scope', fields: [ { name: 'deliverables', label: 'Deliverables', type: 'textarea', required: true } ] },
    { title: 'Budget & Timeline', fields: [ { name: 'budgetUsd', label: 'Budget (USD)', type: 'number', required: true }, { name: 'timeline', label: 'Target Timeline (weeks)', type: 'number' } ] },
    { title: 'Confirm', fields: [ { name: 'notes', label: 'Additional Notes', type: 'textarea' } ] },
  ];
}

type Props = {
  open: boolean;
  onClose: () => void;
  serviceName: string;
};

export default function ServiceRequestModal({ open, onClose, serviceName }: Props) {
  const { user } = useUser();
  const steps = useMemo(() => getFormSteps(serviceName), [serviceName]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

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
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const validateCurrentStep = (): boolean => {
    const current = steps[stepIndex];
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
          <h4 className="text-lg font-semibold text-white">{steps[stepIndex].title}</h4>
          {steps[stepIndex].fields.map((f) => (
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