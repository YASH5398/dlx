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
    <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-4 py-8 sm:py-12 lg:py-16">
      <ToastContainer />
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Join Our Affiliate Program
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Become a partner and earn commissions by promoting our innovative products. Complete the application below to get started.
          </p>
          <Link
            to="/affiliate-program/info"
            className="mt-6 inline-block text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
          >
            Learn more about the program
          </Link>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-8 animate-pulse">
            <div className="h-6 bg-gray-700/30 rounded mb-4 w-3/4 mx-auto" />
            <div className="h-4 bg-gray-700/30 rounded mb-3 w-full" />
            <div className="h-4 bg-gray-700/30 rounded mb-3 w-5/6" />
            <div className="h-4 bg-gray-700/30 rounded w-2/3" />
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 backdrop-blur-md p-6 sm:p-8 lg:p-10">
            <Stepper currentStep={step} totalSteps={totalSteps} />
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
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
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-medium text-gray-300">Step {currentStep + 1} of {totalSteps}</span>
        <span className="text-sm font-medium text-cyan-400">{percent}% Complete</span>
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-6">
        {STEP_META.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                i <= currentStep
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ring-2 ring-cyan-400/40'
                  : 'bg-gray-700/40 text-gray-400 ring-2 ring-gray-600/40'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === currentStep ? 'text-white' : 'text-gray-400'
              } hidden sm:block`}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-2 rounded-full bg-gray-700/40 mt-6 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200 mb-2">
      {children}
    </label>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${className || ''}`}
    />
  );
}

function SelectInput({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 ${className || ''}`}
    >
      {children}
    </select>
  );
}

function StepActions({ step, totalSteps, onBack, onNext }) {
  return (
    <div className="flex justify-between mt-10">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className="px-6 py-3 rounded-lg bg-gray-700/40 border border-gray-600/40 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Back
      </button>
      {step < totalSteps - 1 ? (
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
        >
          Submit Application
        </button>
      )}
    </div>
  );
}

function StepPersonalInfo() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Personal Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            {...register("fullName", { required: "Full name is required" })}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            {...register("phone", {
              required: "Phone number is required",
              validate: (v) => validators.phoneIntl(v) || "Invalid phone number format",
            })}
            placeholder="e.g. +1234567890"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "Email is required",
              validate: (v) => validators.email(v) || "Invalid email format",
            })}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register("city", { required: "City is required" })}
            placeholder="Your city"
          />
          {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <SelectInput
            id="country"
            {...register("country", { required: "Country is required" })}
          >
            <option value="" disabled>Select country</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </SelectInput>
          {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>}
        </div>
        <div>
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            {...register("website", {
              validate: (v) => validators.url(v) || "Invalid URL format",
            })}
            placeholder="https://yourwebsite.com"
          />
          {errors.website && <p className="mt-1 text-sm text-red-400">{errors.website.message}</p>}
        </div>
      </div>
    </div>
  );
}

function StepProfiles() {
  const { control, register, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "profiles" });
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Social Profiles</h2>
      <div className="flex items-center justify-between">
        <Label>Social Media Profiles</Label>
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
            <Label htmlFor={`profiles.${index}.platform`}>Platform</Label>
            <SelectInput
              id={`profiles.${index}.platform`}
              {...register(`profiles.${index}.platform`, { required: "Platform is required" })}
            >
              <option value="" disabled>Select platform</option>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectInput>
            {errors.profiles?.[index]?.platform && (
              <p className="mt-1 text-sm text-red-400">{errors.profiles[index].platform.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor={`profiles.${index}.url`}>Profile URL</Label>
            <Input
              id={`profiles.${index}.url`}
              {...register(`profiles.${index}.url`, {
                required: "Profile URL is required",
                validate: (v) => validators.url(v) || "Invalid URL format",
              })}
              placeholder="https://platform.com/you"
            />
            {errors.profiles?.[index]?.url && (
              <p className="mt-1 text-sm text-red-400">{errors.profiles[index].url.message}</p>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="w-full px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-200"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepFocusAreas() {
  const { setValue, watch, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Focus Areas</h2>
      <div>
        <Label htmlFor="categories">Promotion Categories</Label>
        <Select
          id="categories"
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => setValue("categories", selected.map((s) => s.value), { shouldValidate: true })}
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
          defaultValue={(watch("categories") || []).map((v) => ({ value: v, label: v }))}
          placeholder="Select categories"
        />
        {errors.categories && <p className="mt-1 text-sm text-red-400">At least one category is required</p>}
      </div>
      <div>
        <Label htmlFor="interests">Products of Interest</Label>
        <Select
          id="interests"
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => setValue("interests", selected.map((s) => s.value), { shouldValidate: true })}
          options={PRODUCT_OPTIONS.map((p) => ({ value: p, label: p }))}
          defaultValue={(watch("interests") || []).map((v) => ({ value: v, label: v }))}
          placeholder="Select products"
        />
        {errors.interests && <p className="mt-1 text-sm text-red-400">At least one product is required</p>}
      </div>
    </div>
  );
}

function StepExperience() {
  const { register, setValue, getValues, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Experience & Reach</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="experienceYears">Years of Experience</Label>
          <Input
            id="experienceYears"
            type="number"
            {...register("experienceYears", {
              required: "Years of experience is required",
              valueAsNumber: true,
              min: { value: 0, message: "Must be a positive number" },
            })}
            placeholder="e.g. 3"
          />
          {errors.experienceYears && <p className="mt-1 text-sm text-red-400">{errors.experienceYears.message}</p>}
        </div>
        <div>
          <Label htmlFor="expectedReferrals">Expected Monthly Referrals</Label>
          <Input
            id="expectedReferrals"
            type="number"
            {...register("expectedReferrals", {
              required: "Expected referrals is required",
              valueAsNumber: true,
              min: { value: 1, message: "Must be at least 1" },
            })}
            placeholder="e.g. 10"
          />
          {errors.expectedReferrals && <p className="mt-1 text-sm text-red-400">{errors.expectedReferrals.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="methods">Promotion Methods</Label>
        <Select
          id="methods"
          isMulti
          styles={selectStyles}
          classNamePrefix="react-select"
          onChange={(selected) => {
            const values = selected.map((s) => s.value);
            setTimeout(() => document.activeElement?.blur(), 0);
            setValue("methods", values, { shouldValidate: true });
          }}
          options={METHOD_OPTIONS.map((m) => ({ value: m, label: m }))}
          defaultValue={(getValues("methods") || []).map((v) => ({ value: v, label: v }))}
          placeholder="Select promotion methods"
        />
        {errors.methods && <p className="mt-1 text-sm text-red-400">At least one method is required</p>}
      </div>
      <div>
        <Label htmlFor="audience">Target Audience</Label>
        <Input
          id="audience"
          {...register("audience", { required: "Target audience is required" })}
          placeholder="e.g. Developers, Small businesses"
        />
        {errors.audience && <p className="mt-1 text-sm text-red-400">{errors.audience.message}</p>}
      </div>
    </div>
  );
}

function StepCompliance() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Compliance & Payout</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="payoutPreference">Payout Preference</Label>
          <SelectInput
            id="payoutPreference"
            {...register("payoutPreference", { required: "Payout preference is required" })}
          >
            <option value="" disabled>Select payout method</option>
            {PAYOUT_OPTIONS.map((option) => (
              <option key={option} value={option.toLowerCase()}>{option}</option>
            ))}
          </SelectInput>
          {errors.payoutPreference && <p className="mt-1 text-sm text-red-400">{errors.payoutPreference.message}</p>}
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-700/40 border border-gray-600/40">
          <input
            id="termsAgreed"
            type="checkbox"
            {...register("termsAgreed", { required: "You must agree to the terms" })}
            className="w-5 h-5 accent-cyan-500 rounded"
          />
          <Label htmlFor="termsAgreed">I agree to the terms and conditions</Label>
          {errors.termsAgreed && <p className="mt-1 text-sm text-red-400">{errors.termsAgreed.message}</p>}
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-700/40 border border-gray-600/40">
          <input
            id="communicationsAgreed"
            type="checkbox"
            {...register("communicationsAgreed")}
            className="w-5 h-5 accent-cyan-500 rounded"
          />
          <Label htmlFor="communicationsAgreed">Opt-in to essential communications</Label>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-700/40">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white max-w-xs text-right">{value || '—'}</span>
    </div>
  );
}

function StepReview() {
  const values = useFormContext().getValues();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Review Your Application</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-lg bg-gray-700/40 border border-gray-600/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Personal Details</h3>
          <Row label="Name" value={values.fullName} />
          <Row label="Phone" value={values.phone} />
          <Row label="Email" value={values.email} />
          <Row label="City" value={values.city} />
          <Row label="Country" value={values.country} />
          <Row label="Website" value={values.website} />
        </div>
        <div className="rounded-lg bg-gray-700/40 border border-gray-600/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Focus & Experience</h3>
          <Row label="Categories" value={(values.categories || []).join(", ")} />
          <Row label="Interests" value={(values.interests || []).join(", ")} />
          <Row label="Experience (years)" value={values.experienceYears} />
          <Row label="Methods" value={(values.methods || []).join(", ")} />
          <Row label="Expected Referrals" value={values.expectedReferrals} />
          <Row label="Audience" value={values.audience} />
          <Row label="Payout" value={values.payoutPreference} />
        </div>
      </div>
      <div className="rounded-lg bg-gray-700/40 border border-gray-600/40 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Social Profiles</h3>
        {(values.profiles || []).map((profile, index) => (
          <Row key={index} label={profile.platform} value={profile.url} />
        ))}
      </div>
    </div>
  );
}

export default AffiliateProgram;