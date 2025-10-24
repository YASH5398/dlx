import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { submitServiceRequest } from '../utils/serviceRequests';
import { logActivity } from '../utils/activity';
import { notifyAdminNewServiceRequest } from '../utils/notifications';
import { getServiceFormConfig, subscribeServiceFormConfig } from '../utils/services';
export default function ServiceRequestModal({ open, onClose, serviceName }) {
    const { user } = useUser();
    const [steps, setSteps] = useState([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);
    // Define 7-step structure: 1 user info, 5 service-specific, 1 verification
    const uiSteps = useMemo(() => {
        const userInfoStep = {
            title: 'Your Information',
            fields: [
                { name: 'fullName', label: 'Full Name', type: 'text', required: true },
                { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
                { name: 'emailId', label: 'Email Address', type: 'email', required: true },
            ],
        };
        // Use admin-defined service steps as-is; ensure we have exactly 5 steps
        const base = Array.isArray(steps) ? [...steps] : [];
        const serviceSteps = base.slice(0, 5);
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
        let unsub = null;
        const init = async () => {
            const cfg = await getServiceFormConfig(serviceName);
            if (cfg && Array.isArray(cfg) && cfg.length) {
                setSteps(cfg);
            }
            else {
                setSteps([]);
            }
            unsub = subscribeServiceFormConfig(serviceName, (next) => {
                if (next && next.length) {
                    setSteps(next);
                }
            });
        };
        init();
        return () => { if (unsub)
            try {
                unsub();
            }
            catch { } };
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
        }
        catch { }
    }, [draftKey]);
    useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify({ stepIndex, answers }));
    }, [stepIndex, answers, draftKey]);
    const totalSteps = uiSteps.length;
    const progressPct = Math.round(((stepIndex + 1) / Math.max(1, totalSteps)) * 100);
    const validateCurrentStep = () => {
        const current = uiSteps[stepIndex];
        if (!current)
            return false;
        if (current.title === 'Verify All Details') {
            setErrors({});
            return true;
        }
        const nextErrors = {};
        for (const f of current.fields) {
            const val = answers[f.name];
            if (f.required && (val === undefined || val === '' ||
                (f.type === 'number' && (val === null || Number.isNaN(Number(val)))) ||
                (f.type === 'checkbox' && (!Array.isArray(val) || val.length === 0)) ||
                (f.type === 'array' && (!Array.isArray(val) || val.filter(Boolean).length === 0)))) {
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
        if (!validateCurrentStep())
            return;
        setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    };
    const handlePrev = () => setStepIndex((i) => Math.max(i - 1, 0));
    const handleEditStep = (index) => {
        setStepIndex(index);
    };
    const handleSubmit = async () => {
        if (!validateCurrentStep() || !user)
            return;
        try {
            setSubmitting(true);
            const id = await submitServiceRequest({
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                serviceName,
                steps: uiSteps,
                answers,
            });
            await logActivity(user.id, 'service_request_submitted', { id, serviceName });
            try {
                document.dispatchEvent(new CustomEvent('notifications:add', {
                    detail: { type: 'service', message: `Service request submitted: ${serviceName}`, meta: { id, serviceName } },
                }));
            }
            catch { }
            await notifyAdminNewServiceRequest({ id, serviceName, userId: user.id, userName: user.name });
            setSubmittedId(id);
            localStorage.removeItem(draftKey);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto scroll-smooth", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "relative w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-white/20 p-6 shadow-2xl shadow-purple-500/20 backdrop-blur-lg max-h-[85vh] overflow-y-auto scroll-smooth", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400", children: ["Request: ", serviceName] }), _jsxs("p", { className: "text-sm text-gray-300", children: ["Step ", stepIndex + 1, " of ", totalSteps] })] }), _jsx("button", { onClick: onClose, className: "rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors", children: "Close" })] }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "h-2 bg-white/10 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-300", style: { width: `${progressPct}%` } }) }), _jsxs("div", { className: "mt-1 text-xs text-gray-300", children: [progressPct, "% complete"] })] }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white", children: uiSteps[stepIndex]?.title }), uiSteps[stepIndex]?.title === 'Verify All Details' ? (_jsx("div", { className: "space-y-3", children: uiSteps.filter((s) => s.title !== 'Verify All Details').map((s, idx) => (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("div", { className: "text-sm font-semibold text-white", children: [idx + 1, ". ", s.title] }), _jsx("button", { onClick: () => handleEditStep(idx), className: "text-xs text-blue-400 hover:text-blue-300", children: "Edit" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: s.fields.map((f) => (_jsxs("div", { className: "text-xs text-gray-300", children: [_jsxs("span", { className: "text-gray-400", children: [f.label, ": "] }), _jsx("span", { className: "text-white/90 break-all", children: Array.isArray(answers[f.name]) ? answers[f.name].filter(Boolean).join(', ') : String(answers[f.name] ?? '') })] }, f.name))) })] }, idx))) })) : (_jsx(_Fragment, { children: uiSteps[stepIndex]?.fields.map((f) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "text-sm text-gray-200", children: [f.label, f.required && _jsx("span", { className: "text-pink-400", children: " *" })] }), f.type === 'text' || f.type === 'email' || f.type === 'tel' ? (_jsx("input", { type: f.type, value: answers[f.name] ?? '', placeholder: f.placeholder || `Enter ${f.label}`, onChange: (e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value })), className: "w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors" })) : f.type === 'number' ? (_jsx("input", { type: "number", value: answers[f.name] ?? '', placeholder: f.placeholder || `Enter ${f.label}`, onChange: (e) => setAnswers((a) => ({ ...a, [f.name]: Number(e.target.value) })), className: "w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors" })) : f.type === 'textarea' ? (_jsx("textarea", { value: answers[f.name] ?? '', placeholder: f.placeholder || `Enter ${f.label}`, rows: 3, onChange: (e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value })), className: "w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors" })) : f.type === 'select' ? (_jsxs(_Fragment, { children: [_jsxs("select", { value: answers[f.name] ?? '', onChange: (e) => setAnswers((a) => ({ ...a, [f.name]: e.target.value })), className: "w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors", children: [_jsx("option", { value: "", className: "bg-gray-800", children: "Select..." }), (f.options || []).map((opt) => (_jsx("option", { value: opt, className: "bg-gray-800", children: opt }, opt)))] }), (answers[f.name] ?? '') === 'Other' && (_jsx("input", { type: "text", value: answers[`${f.name}__other`] ?? '', onChange: (e) => setAnswers((a) => ({ ...a, [`${f.name}__other`]: e.target.value })), placeholder: `Specify other for ${f.label}`, className: "mt-2 w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors" }))] })) : f.type === 'checkbox' ? (_jsx("div", { className: "flex flex-wrap gap-2", children: (f.options || []).map((opt) => {
                                                const current = Array.isArray(answers[f.name]) ? answers[f.name] : [];
                                                const checked = current.includes(opt);
                                                return (_jsxs("label", { className: "inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => {
                                                                setAnswers((a) => {
                                                                    const arr = Array.isArray(a[f.name]) ? a[f.name] : [];
                                                                    const next = e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt);
                                                                    return { ...a, [f.name]: next };
                                                                });
                                                            }, className: "text-purple-400 focus:ring-purple-400/50" }), _jsx("span", { className: "text-sm text-gray-200", children: opt })] }, opt));
                                            }) })) : f.type === 'radio' ? (_jsx("div", { className: "flex flex-wrap gap-2", children: (f.options || []).map((opt) => (_jsxs("label", { className: "inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors", children: [_jsx("input", { type: "radio", name: f.name, checked: (answers[f.name] ?? '') === opt, onChange: () => setAnswers((a) => ({ ...a, [f.name]: opt })), className: "text-purple-400 focus:ring-purple-400/50" }), _jsx("span", { className: "text-sm text-gray-200", children: opt })] }, opt))) })) : f.type === 'array' ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "flex flex-col gap-2", children: Array.isArray(answers[f.name]) && answers[f.name].length > 0 ? (answers[f.name].map((val, idx) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: f.itemType || 'text', value: val, placeholder: f.itemLabel || 'Enter value', onChange: (e) => setAnswers((a) => {
                                                                    const arr = Array.isArray(a[f.name]) ? [...a[f.name]] : [];
                                                                    arr[idx] = e.target.value;
                                                                    return { ...a, [f.name]: arr };
                                                                }), className: "flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 hover:bg-white/15 transition-colors" }), _jsx("button", { onClick: () => setAnswers((a) => {
                                                                    const arr = Array.isArray(a[f.name]) ? [...a[f.name]] : [];
                                                                    arr.splice(idx, 1);
                                                                    return { ...a, [f.name]: arr };
                                                                }), className: "px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20", children: "Remove" })] }, `${f.name}-${idx}`)))) : (_jsx("div", { className: "text-xs text-gray-400", children: "No entries added yet." })) }), _jsx("button", { onClick: () => setAnswers((a) => {
                                                        const arr = Array.isArray(a[f.name]) ? [...a[f.name]] : [];
                                                        arr.push('');
                                                        return { ...a, [f.name]: arr };
                                                    }), className: "px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20", children: "+ Add" })] })) : null, errors[f.name] && _jsx("div", { className: "text-xs text-pink-300", children: errors[f.name] })] }, f.name))) }))] }), _jsxs("div", { className: "mt-6 flex items-center justify-between sticky bottom-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 py-4 -mx-6 px-6", children: [_jsx("button", { onClick: handlePrev, disabled: stepIndex === 0, className: "px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-50 hover:bg-white/20 transition-colors", children: "Previous" }), stepIndex < totalSteps - 1 ? (_jsx("button", { onClick: handleNext, className: "px-6 py-2 rounded-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white shadow-[0_0_16px_rgba(0,212,255,0.25)] hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-colors", children: "Next" })) : (_jsx("button", { onClick: handleSubmit, disabled: submitting, className: "px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-[0_0_16px_rgba(0,212,255,0.25)] disabled:opacity-50 transition-colors", children: submitting ? 'Submitting...' : 'Submit Request' }))] }), submittedId && (_jsxs("div", { className: "mt-6 p-4 rounded-xl bg-white/5 border border-white/10", children: [_jsx("p", { className: "text-sm text-gray-200", children: "Your request has been submitted successfully." }), _jsxs("p", { className: "text-xs text-gray-300 mt-1", children: ["Reference ID: ", submittedId] }), _jsx("div", { className: "mt-3 flex justify-end", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors", children: "Close" }) })] }))] })] }));
}
