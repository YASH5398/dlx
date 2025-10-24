import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
// Validators
const validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''),
    phoneIntl: (v) => /^\+\d{10,15}$/.test(v || ''),
    url: (v) => !v || /^(https?:\/\/)?[\w.-]+(\.[\w.-]+)+[\w\-._~:\/?#\[\]@!$&'()*+,;=.]+$/.test(v || ''),
};
// Mock service
const affiliateService = {
    async get() {
        await new Promise((r) => setTimeout(r, 600));
        return {
            fullName: 'Sourav Kumar Verma',
            email: 'yashrajputyt23@gmail.com',
            phone: '+919508310294',
            city: 'Deoghar',
            country: 'India',
            website: 'gg',
            socials: [],
            categories: ['Social Media', 'SEO'],
            interests: ['Automation Workflows'],
            yearsOfExperience: 4,
            methods: ['Instagram Reels', 'LinkedIn Posts'],
            audience: 'v',
            expectedMonthlyReferrals: 6,
            termsAgreed: false,
            communicationsAgreed: true,
            payoutPreference: 'bank',
            payoutDetails: '',
        };
    },
    async submit(data) {
        await new Promise((r) => setTimeout(r, 900));
        if (!data.termsAgreed) {
            return { success: false, errors: ['Please accept the Terms and Conditions.'] };
        }
        return { success: true };
    },
};
const STEP_META = [
    { id: 1, name: 'Personal Info' },
    { id: 2, name: 'Social Profiles' },
    { id: 3, name: 'Focus Areas' },
    { id: 4, name: 'Experience' },
    { id: 5, name: 'Compliance' },
    { id: 6, name: 'Review' },
];
const PLATFORM_OPTIONS = ['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'Twitter', 'TikTok'];
const CATEGORY_OPTIONS = ['Social Media', 'SEO', 'Content Marketing', 'Email', 'Paid Ads'];
const PRODUCT_OPTIONS = ['Automation Workflows', 'Digital Products', 'Consulting', 'Courses', 'Tools'];
const METHOD_OPTIONS = ['Instagram Reels', 'LinkedIn Posts', 'Blogs', 'YouTube', 'Email blasts', 'Automation Workflows'];
const COUNTRY_OPTIONS = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Other'];
const PAYOUT_OPTIONS = ['Bank', 'Crypto Wallet', 'PayPal', 'UPI', 'Other'];
const selectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#1f2937',
        borderColor: state.isFocused ? '#06b6d4' : '#4b5563',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(6, 182, 212, 0.3)' : 'none',
        '&:hover': { borderColor: '#06b6d4' },
        borderRadius: '0.5rem',
        padding: '0.25rem',
        color: '#fff',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: '#111827',
        border: '1px solid #4b5563',
        borderRadius: '0.5rem',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#06b6d4' : state.isFocused ? '#1f2937' : 'transparent',
        color: state.isSelected ? '#111827' : '#e5e7eb',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderRadius: '0.375rem',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#e5e7eb',
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#e5e7eb',
        ':hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
        },
    }),
    singleValue: (base) => ({
        ...base,
        color: '#e5e7eb',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#9ca3af',
    }),
};
function AffiliateProgram() {
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState(null);
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        affiliateService
            .get()
            .then((data) => {
            if (mounted) {
                setInitialData(data);
                setLoading(false);
            }
        })
            .catch(() => setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);
    const methods = useForm({
        defaultValues: initialData || {
            fullName: "",
            phone: "",
            email: "",
            city: "",
            country: "",
            website: "",
            profiles: [{ platform: "Instagram", url: "" }],
            categories: [],
            interests: [],
            experienceYears: "",
            methods: [],
            expectedReferrals: "",
            audience: "",
            termsAgreed: false,
            communicationsAgreed: true,
            payoutPreference: "bank",
        },
        mode: "onChange",
    });
    useEffect(() => {
        if (initialData) {
            methods.reset(initialData);
        }
    }, [initialData, methods]);
    const [step, setStep] = useState(0);
    const totalSteps = STEP_META.length;
    const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));
    const onSubmit = async (data) => {
        try {
            const res = await affiliateService.submit(data);
            if (res?.success) {
                toast.success("Application submitted successfully. We'll review and contact you.", {
                    position: "top-right",
                    autoClose: 3500,
                    theme: "dark",
                });
            }
            else {
                const msg = (res?.errors && res.errors[0]) || "Submission failed. Please try again.";
                toast.error(msg, { position: "top-right", autoClose: 3500, theme: "dark" });
            }
        }
        catch (err) {
            toast.error("Submission failed. Please try again.", {
                position: "top-right",
                autoClose: 3500,
                theme: "dark",
            });
        }
    };
    return (_jsxs("section", { className: "min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-4 py-8 sm:py-12 lg:py-16", children: [_jsx(ToastContainer, {}), _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("header", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl sm:text-5xl font-extrabold text-white tracking-tight", children: "Join Our Affiliate Program" }), _jsx("p", { className: "mt-4 text-lg text-gray-300 max-w-2xl mx-auto", children: "Become a partner and earn commissions by promoting our innovative products. Complete the application below to get started." }), _jsx(Link, { to: "/affiliate-program/info", className: "mt-6 inline-block text-cyan-400 hover:text-cyan-300 transition-colors duration-200", children: "Learn more about the program" })] }), loading ? (_jsxs("div", { className: "rounded-2xl bg-gray-800/30 border border-gray-700/30 p-8 animate-pulse", children: [_jsx("div", { className: "h-6 bg-gray-700/30 rounded mb-4 w-3/4 mx-auto" }), _jsx("div", { className: "h-4 bg-gray-700/30 rounded mb-3 w-full" }), _jsx("div", { className: "h-4 bg-gray-700/30 rounded mb-3 w-5/6" }), _jsx("div", { className: "h-4 bg-gray-700/30 rounded w-2/3" })] })) : (_jsxs("div", { className: "rounded-2xl bg-gray-800/30 border border-gray-700/30 backdrop-blur-md p-6 sm:p-8 lg:p-10", children: [_jsx(Stepper, { currentStep: step, totalSteps: totalSteps }), _jsx(FormProvider, { ...methods, children: _jsxs("form", { onSubmit: methods.handleSubmit(onSubmit), className: "space-y-8", children: [step === 0 && _jsx(StepPersonalInfo, {}), step === 1 && _jsx(StepProfiles, {}), step === 2 && _jsx(StepFocusAreas, {}), step === 3 && _jsx(StepExperience, {}), step === 4 && _jsx(StepCompliance, {}), step === 5 && _jsx(StepReview, {}), _jsx(StepActions, { step: step, totalSteps: totalSteps, onBack: prevStep, onNext: nextStep })] }) })] }))] })] }));
}
function Stepper({ currentStep, totalSteps }) {
    const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
    return (_jsxs("div", { className: "mb-10", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("span", { className: "text-sm font-medium text-gray-300", children: ["Step ", currentStep + 1, " of ", totalSteps] }), _jsxs("span", { className: "text-sm font-medium text-cyan-400", children: [percent, "% Complete"] })] }), _jsx("div", { className: "flex flex-wrap gap-4 sm:gap-6", children: STEP_META.map((s, i) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${i <= currentStep
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ring-2 ring-cyan-400/40'
                                : 'bg-gray-700/40 text-gray-400 ring-2 ring-gray-600/40'}`, children: i + 1 }), _jsx("span", { className: `text-sm font-medium ${i === currentStep ? 'text-white' : 'text-gray-400'} hidden sm:block`, children: s.name })] }, s.id))) }), _jsx("div", { className: "relative h-2 rounded-full bg-gray-700/40 mt-6 overflow-hidden", children: _jsx("div", { className: "absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500", style: { width: `${percent}%` } }) })] }));
}
function Label({ children, htmlFor }) {
    return (_jsx("label", { htmlFor: htmlFor, className: "block text-sm font-medium text-gray-200 mb-2", children: children }));
}
function Input({ className, ...props }) {
    return (_jsx("input", { ...props, className: `w-full px-4 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${className || ''}` }));
}
function SelectInput({ className, children, ...props }) {
    return (_jsx("select", { ...props, className: `w-full px-4 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 ${className || ''}`, children: children }));
}
function StepActions({ step, totalSteps, onBack, onNext }) {
    return (_jsxs("div", { className: "flex justify-between mt-10", children: [_jsx("button", { type: "button", onClick: onBack, disabled: step === 0, className: "px-6 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200", children: "Back" }), step < totalSteps - 1 ? (_jsx("button", { type: "button", onClick: onNext, className: "px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 transition-all duration-200", children: "Next" })) : (_jsx("button", { type: "submit", className: "px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 focus:ring-2 focus:ring-emerald-500 transition-all duration-200", children: "Submit Application" }))] }));
}
function StepPersonalInfo() {
    const { register, formState: { errors } } = useFormContext();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", ...register("fullName", { required: "Full name is required" }), placeholder: "Enter your full name" }), errors.fullName && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.fullName.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Phone Number" }), _jsx(Input, { id: "phone", ...register("phone", {
                                    required: "Phone number is required",
                                    validate: (v) => validators.phoneIntl(v) || "Invalid phone number format",
                                }), placeholder: "e.g. +1234567890" }), errors.phone && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.phone.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsx(Input, { id: "email", type: "email", ...register("email", {
                                    required: "Email is required",
                                    validate: (v) => validators.email(v) || "Invalid email format",
                                }), placeholder: "you@example.com" }), errors.email && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.email.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: "City" }), _jsx(Input, { id: "city", ...register("city", { required: "City is required" }), placeholder: "Your city" }), errors.city && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.city.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "country", children: "Country" }), _jsxs(SelectInput, { id: "country", ...register("country", { required: "Country is required" }), children: [_jsx("option", { value: "", disabled: true, children: "Select country" }), COUNTRY_OPTIONS.map((option) => (_jsx("option", { value: option, children: option }, option)))] }), errors.country && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.country.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "website", children: "Website (optional)" }), _jsx(Input, { id: "website", ...register("website", {
                                    validate: (v) => validators.url(v) || "Invalid URL format",
                                }), placeholder: "https://yourwebsite.com" }), errors.website && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.website.message })] })] })] }));
}
function StepProfiles() {
    const { control, register, formState: { errors } } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "profiles" });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Social Profiles" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { children: "Social Media Profiles" }), _jsx("button", { type: "button", onClick: () => append({ platform: "", url: "" }), className: "px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200 transition-all duration-200 text-sm", children: "+ Add Profile" })] }), fields.map((field, index) => (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 items-end", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: `profiles.${index}.platform`, children: "Platform" }), _jsxs(SelectInput, { id: `profiles.${index}.platform`, ...register(`profiles.${index}.platform`, { required: "Platform is required" }), children: [_jsx("option", { value: "", disabled: true, children: "Select platform" }), PLATFORM_OPTIONS.map((option) => (_jsx("option", { value: option, children: option }, option)))] }), errors.profiles?.[index]?.platform && (_jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.profiles[index].platform.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: `profiles.${index}.url`, children: "Profile URL" }), _jsx(Input, { id: `profiles.${index}.url`, ...register(`profiles.${index}.url`, {
                                    required: "Profile URL is required",
                                    validate: (v) => validators.url(v) || "Invalid URL format",
                                }), placeholder: "https://platform.com/you" }), errors.profiles?.[index]?.url && (_jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.profiles[index].url.message }))] }), _jsx("div", { children: _jsx("button", { type: "button", onClick: () => remove(index), className: "w-full px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-200", children: "Remove" }) })] }, field.id)))] }));
}
function StepFocusAreas() {
    const { setValue, watch, formState: { errors } } = useFormContext();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Focus Areas" }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "categories", children: "Promotion Categories" }), _jsx(Select, { id: "categories", isMulti: true, styles: selectStyles, classNamePrefix: "react-select", onChange: (selected) => setValue("categories", selected.map((s) => s.value), { shouldValidate: true }), options: CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })), defaultValue: (watch("categories") || []).map((v) => ({ value: v, label: v })), placeholder: "Select categories" }), errors.categories && _jsx("p", { className: "mt-1 text-sm text-red-400", children: "At least one category is required" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "interests", children: "Products of Interest" }), _jsx(Select, { id: "interests", isMulti: true, styles: selectStyles, classNamePrefix: "react-select", onChange: (selected) => setValue("interests", selected.map((s) => s.value), { shouldValidate: true }), options: PRODUCT_OPTIONS.map((p) => ({ value: p, label: p })), defaultValue: (watch("interests") || []).map((v) => ({ value: v, label: v })), placeholder: "Select products" }), errors.interests && _jsx("p", { className: "mt-1 text-sm text-red-400", children: "At least one product is required" })] })] }));
}
function StepExperience() {
    const { register, setValue, getValues, formState: { errors } } = useFormContext();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Experience & Reach" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "experienceYears", children: "Years of Experience" }), _jsx(Input, { id: "experienceYears", type: "number", ...register("experienceYears", {
                                    required: "Years of experience is required",
                                    valueAsNumber: true,
                                    min: { value: 0, message: "Must be a positive number" },
                                }), placeholder: "e.g. 3" }), errors.experienceYears && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.experienceYears.message })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "expectedReferrals", children: "Expected Monthly Referrals" }), _jsx(Input, { id: "expectedReferrals", type: "number", ...register("expectedReferrals", {
                                    required: "Expected referrals is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Must be at least 1" },
                                }), placeholder: "e.g. 10" }), errors.expectedReferrals && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.expectedReferrals.message })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "methods", children: "Promotion Methods" }), _jsx(Select, { id: "methods", isMulti: true, styles: selectStyles, classNamePrefix: "react-select", onChange: (selected) => {
                            const values = selected.map((s) => s.value);
                            setTimeout(() => document.activeElement?.blur(), 0);
                            setValue("methods", values, { shouldValidate: true });
                        }, options: METHOD_OPTIONS.map((m) => ({ value: m, label: m })), defaultValue: (getValues("methods") || []).map((v) => ({ value: v, label: v })), placeholder: "Select promotion methods" }), errors.methods && _jsx("p", { className: "mt-1 text-sm text-red-400", children: "At least one method is required" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "audience", children: "Target Audience" }), _jsx(Input, { id: "audience", ...register("audience", { required: "Target audience is required" }), placeholder: "e.g. Developers, Small businesses" }), errors.audience && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.audience.message })] })] }));
}
function StepCompliance() {
    const { register, formState: { errors } } = useFormContext();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Compliance & Payout" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "payoutPreference", children: "Payout Preference" }), _jsxs(SelectInput, { id: "payoutPreference", ...register("payoutPreference", { required: "Payout preference is required" }), children: [_jsx("option", { value: "", disabled: true, children: "Select payout method" }), PAYOUT_OPTIONS.map((option) => (_jsx("option", { value: option.toLowerCase(), children: option }, option)))] }), errors.payoutPreference && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.payoutPreference.message })] }), _jsxs("div", { className: "flex items-center gap-3 p-4 rounded-lg bg-gray-700/40 border border-gray-600/40", children: [_jsx("input", { id: "termsAgreed", type: "checkbox", ...register("termsAgreed", { required: "You must agree to the terms" }), className: "w-5 h-5 accent-cyan-500 rounded" }), _jsx(Label, { htmlFor: "termsAgreed", children: "I agree to the terms and conditions" }), errors.termsAgreed && _jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.termsAgreed.message })] }), _jsxs("div", { className: "flex items-center gap-3 p-4 rounded-lg bg-gray-700/40 border border-gray-600/40", children: [_jsx("input", { id: "communicationsAgreed", type: "checkbox", ...register("communicationsAgreed"), className: "w-5 h-5 accent-cyan-500 rounded" }), _jsx(Label, { htmlFor: "communicationsAgreed", children: "Opt-in to essential communications" })] })] })] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex justify-between py-3 border-b border-gray-700/40", children: [_jsx("span", { className: "text-sm text-gray-400", children: label }), _jsx("span", { className: "text-sm font-medium text-white max-w-xs text-right", children: value || '—' })] }));
}
function StepReview() {
    const values = useFormContext().getValues();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Review Your Application" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [_jsxs("div", { className: "rounded-lg bg-gray-700/40 border border-gray-600/40 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Personal Details" }), _jsx(Row, { label: "Name", value: values.fullName }), _jsx(Row, { label: "Phone", value: values.phone }), _jsx(Row, { label: "Email", value: values.email }), _jsx(Row, { label: "City", value: values.city }), _jsx(Row, { label: "Country", value: values.country }), _jsx(Row, { label: "Website", value: values.website })] }), _jsxs("div", { className: "rounded-lg bg-gray-700/40 border border-gray-600/40 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Focus & Experience" }), _jsx(Row, { label: "Categories", value: (values.categories || []).join(", ") }), _jsx(Row, { label: "Interests", value: (values.interests || []).join(", ") }), _jsx(Row, { label: "Experience (years)", value: values.experienceYears }), _jsx(Row, { label: "Methods", value: (values.methods || []).join(", ") }), _jsx(Row, { label: "Expected Referrals", value: values.expectedReferrals }), _jsx(Row, { label: "Audience", value: values.audience }), _jsx(Row, { label: "Payout", value: values.payoutPreference })] })] }), _jsxs("div", { className: "rounded-lg bg-gray-700/40 border border-gray-600/40 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Social Profiles" }), (values.profiles || []).map((profile, index) => (_jsx(Row, { label: profile.platform, value: profile.url }, index)))] })] }));
}
export default AffiliateProgram;
