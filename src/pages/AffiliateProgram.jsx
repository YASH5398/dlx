import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function AffiliateProgram() {
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
      termsAccepted: false,
      communicationsOptIn: true,
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
      } else {
        const msg = (res?.errors && res.errors[0]) || "Submission failed. Please try again.";
        toast.error(msg, { position: "top-right", autoClose: 3500, theme: "dark" });
      }
    } catch (err) {
      toast.error("Submission failed. Please try again.", {
        position: "top-right",
        autoClose: 3500,
        theme: "dark",
      });
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ToastContainer />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          Affiliate Program
        </h1>
        <p className="text-gray-300 mb-8 text-sm sm:text-base">
          Join our program to earn commissions by promoting our products. Complete the form below to apply.
        </p>

        {loading ? (
          <div className="rounded-2xl bg-gray-800/50 border border-gray-700/50 p-6 animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-700/50 rounded mb-3 w-full" />
            <div className="h-4 bg-gray-700/50 rounded mb-3 w-5/6" />
            <div className="h-4 bg-gray-700/50 rounded w-2/3" />
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm p-6 sm:p-8">
            <Stepper currentStep={step} totalSteps={totalSteps} />
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                {step === 0 && <StepPersonalInfo />}
                {step === 1 && <StepProfiles />}
                {step === 2 && <StepFocusAreas />}
                {step === 3 && <StepExperience />}
                {step === 4 && <StepCompliance />}
                {step === 5 && <StepReview />}
                <StepActions step={step} totalSteps={totalSteps} onBack={prevStep} onNext={nextStep} />
              </form>
            </FormProvider>
          </div>
        )}
      </div>
    </section>
  );
}

function Stepper({ currentStep, totalSteps }) {
  const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-400">Step {currentStep + 1} of {totalSteps}</span>
        <span className="text-sm text-gray-300">{percent}% Complete</span>
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {STEP_META.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                i <= currentStep
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ring-2 ring-cyan-400/30'
                  : 'bg-gray-700/50 text-gray-400 ring-2 ring-gray-600/30'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${
                i === currentStep ? 'text-white font-medium' : 'text-gray-400'
              } hidden sm:block`}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-1.5 rounded-full bg-gray-700/50 mt-4 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-sm font-medium text-gray-200 mb-2">
      {children}
    </label>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${className || ''}`}
    />
  );
}

function StepActions({ step, totalSteps, onBack, onNext }) {
  return (
    <div className="flex justify-between mt-8">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className="px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Back
      </button>
      {step < totalSteps - 1 ? (
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
        >
          Submit
        </button>
      )}
    </div>
  );
}

function StepPersonalInfo() {
  const { register } = useFormContext();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Full Name</Label>
          <Input {...register("fullName", { required: true })} placeholder="Enter your full name" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register("phone", { required: true })} placeholder="e.g. +1234567890" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input type="email" {...register("email", { required: true })} placeholder="you@example.com" />
        </div>
        <div>
          <Label>City</Label>
          <Input {...register("city", { required: true })} placeholder="Your city" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Country</Label>
          <select
            {...register("country", { required: true })}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
          >
            <option value="" disabled>Select country</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Website (optional)</Label>
          <Input {...register("website")} placeholder="https://yourwebsite.com" />
        </div>
      </div>
    </div>
  );
}

function StepProfiles() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "profiles" });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>Social Profiles</Label>
        <button
          type="button"
          onClick={() => append({ platform: "", url: "" })}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200 transition-all duration-200 text-sm"
        >
          + Add Profile
        </button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Platform</Label>
            <select
              {...register(`profiles.${index}.platform`, { required: true })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
            >
              <option value="" disabled>Select platform</option>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Profile URL</Label>
            <Input {...register(`profiles.${index}.url`, { required: true })} placeholder="https://platform.com/you" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="w-full px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-200"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: state.isFocused ? '#06b6d4' : 'rgba(75, 85, 99, 0.5)',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(6, 182, 212, 0.3)' : 'none',
    '&:hover': { borderColor: '#06b6d4' },
    borderRadius: '0.5rem',
    padding: '0.25rem',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(75, 85, 99, 0.5)',
    borderRadius: '0.5rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#06b6d4'
      : state.isFocused
      ? 'rgba(31, 41, 55, 0.8)'
      : 'transparent',
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
};

function StepFocusAreas() {
  const { setValue, watch } = useFormContext();
  return (
    <div className="space-y-6">
      <div>
        <Label>Promotion Categories</Label>
        <Select
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => setValue("categories", selected.map((s) => s.value))}
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
          defaultValue={(watch("categories") || []).map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div>
        <Label>Products of Interest</Label>
        <Select
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => setValue("interests", selected.map((s) => s.value))}
          options={PRODUCT_OPTIONS.map((p) => ({ value: p, label: p }))}
          defaultValue={(watch("interests") || []).map((v) => ({ value: v, label: v }))}
        />
      </div>
    </div>
  );
}

function StepExperience() {
  const { register, setValue, getValues } = useFormContext();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Years of Experience</Label>
          <Input
            type="number"
            {...register("experienceYears", { required: true, valueAsNumber: true })}
            placeholder="e.g. 3"
          />
        </div>
        <div>
          <Label>Expected Monthly Referrals</Label>
          <Input
            type="number"
            {...register("expectedReferrals", { required: true, valueAsNumber: true })}
            placeholder="e.g. 10"
          />
        </div>
      </div>
      <div>
        <Label>Promotion Methods</Label>
        <Select
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => {
            const values = selected.map((s) => s.value);
            setTimeout(() => document.activeElement?.blur(), 0);
            setValue("methods", values);
          }}
          options={METHOD_OPTIONS.map((m) => ({ value: m, label: m }))}
          defaultValue={(getValues("methods") || []).map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div>
        <Label>Audience</Label>
        <Input {...register("audience", { required: true })} placeholder="e.g. Developers, Small businesses" />
      </div>
    </div>
  );
}

function StepCompliance() {
  const { register } = useFormContext();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>Payout Preference</Label>
          <select
            {...register("payoutPreference", { required: true })}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
          >
            {PAYOUT_OPTIONS.map((option) => (
              <option key={option} value={option.toLowerCase()}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
          <input
            type="checkbox"
            {...register("termsAccepted", { required: true })}
            className="w-5 h-5 accent-cyan-500 rounded"
          />
          <span className="text-sm text-gray-300">I agree to the terms and conditions</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
          <input
            type="checkbox"
            {...register("communicationsOptIn")}
            className="w-5 h-5 accent-cyan-500 rounded"
          />
          <span className="text-sm text-gray-300">Opt-in to essential communications</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-700/50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white">{value || '—'}</span>
    </div>
  );
}

function StepReview() {
  const values = useFormContext().getValues();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-700/50 border border-gray-600/50 p-5">
          <h3 className="text-white text-base font-semibold mb-4">Personal Details</h3>
          <Row label="Name" value={values.fullName} />
          <Row label="Phone" value={values.phone} />
          <Row label="Email" value={values.email} />
          <Row label="City" value={values.city} />
          <Row label="Country" value={values.country} />
          <Row label="Website" value={values.website} />
        </div>
        <div className="rounded-lg bg-gray-700/50 border border-gray-600/50 p-5">
          <h3 className="text-white text-base font-semibold mb-4">Focus & Experience</h3>
          <Row label="Categories" value={(values.categories || []).join(", ")} />
          <Row label="Interests" value={(values.interests || []).join(", ")} />
          <Row label="Experience (years)" value={values.experienceYears} />
          <Row label="Methods" value={(values.methods || []).join(", ")} />
          <Row label="Expected Referrals" value={values.expectedReferrals} />
          <Row label="Audience" value={values.audience} />
          <Row label="Payout" value={values.payoutPreference} />
        </div>
      </div>
    </div>
  );
}