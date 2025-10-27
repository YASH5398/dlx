import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  UserIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface ApplicationData {
  // Step 1: Personal Info
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  linkedin: string;
  github: string;
  portfolio: string;
  
  // Step 2: Education & Experience
  education: string;
  university: string;
  graduation_year: string;
  certifications: string[];
  experience_years: string;
  current_role: string;
  previous_companies: string[];
  
  // Step 3: Skills & Preferences
  skills: string[];
  preferred_role: string;
  expected_salary: string;
  availability: string;
  work_location: string;
  timezone: string;
  
  // Step 4: Documents & Motivation
  resume_url: string;
  cover_letter_url: string;
  motivation: string;
  strengths_weaknesses: string;
  references: string[];
  portfolio_projects: string[];
  additional_info: string;
}

interface ApplicationStatus {
  id: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  trustFeeStatus: 'pending' | 'paid' | 'verified';
  trustFeeAmount: number;
  whatsappNumber?: string;
  telegramUsername?: string;
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  paymentVerifiedAt?: string;
}

const skillsOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'JavaScript',
  'TypeScript', 'PHP', 'Laravel', 'Django', 'Flask', 'Express.js', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Docker', 'Kubernetes', 'Git',
  'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI/UX Design',
  'Mobile Development', 'Flutter', 'React Native', 'iOS', 'Android', 'Swift',
  'Kotlin', 'Machine Learning', 'AI', 'Data Science', 'Blockchain', 'Web3'
];

const roles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'UI/UX Designer', 'Graphic Designer', 'DevOps Engineer', 'Data Scientist',
  'Machine Learning Engineer', 'Blockchain Developer', 'Product Manager',
  'Project Manager', 'Marketing Specialist', 'Content Writer', 'Digital Marketer'
];

const availabilityOptions = [
  'Full-time', 'Part-time', 'Freelance', 'Contract', 'Internship'
];

const workLocationOptions = [
  'Remote', 'Onsite', 'Hybrid', 'Flexible'
];

export default function WorkWithUs() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: '',
    linkedin: '',
    github: '',
    portfolio: '',
    education: '',
    university: '',
    graduation_year: '',
    certifications: [],
    experience_years: '',
    current_role: '',
    previous_companies: [],
    skills: [],
    preferred_role: '',
    expected_salary: '',
    availability: '',
    work_location: '',
    timezone: '',
    resume_url: '',
    cover_letter_url: '',
    motivation: '',
    strengths_weaknesses: '',
    references: [],
    portfolio_projects: [],
    additional_info: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  // Check for existing application on component mount
  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) return;
    
    setCheckingStatus(true);
    try {
      const q = query(
        collection(firestore, 'applicants'),
        where('user_id', '==', user.id)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setApplicationStatus({
          id: doc.id,
          status: data.status || 'pending',
          trustFeeStatus: data.trustFeeStatus || 'pending',
          trustFeeAmount: data.trustFeeAmount || 12,
          whatsappNumber: data.whatsappNumber,
          telegramUsername: data.telegramUsername,
          adminNotes: data.adminNotes,
          submittedAt: data.submitted_at,
          reviewedAt: data.reviewed_at,
          paymentVerifiedAt: data.paymentVerifiedAt
        });
      }
    } catch (error) {
      console.error('Error checking existing application:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (field: keyof ApplicationData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.full_name) newErrors.full_name = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.dob) newErrors.dob = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.country) newErrors.country = 'Country is required';
    } else if (step === 2) {
      if (!formData.education) newErrors.education = 'Education level is required';
      if (!formData.experience_years) newErrors.experience_years = 'Experience is required';
      if (!formData.current_role) newErrors.current_role = 'Current role is required';
    } else if (step === 3) {
      if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
      if (!formData.preferred_role) newErrors.preferred_role = 'Preferred role is required';
      if (!formData.availability) newErrors.availability = 'Availability is required';
    } else if (step === 4) {
      if (!formData.motivation) newErrors.motivation = 'Motivation is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      const applicationData = {
        ...formData,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        trustFeeStatus: 'pending',
        trustFeeAmount: 12,
        user_id: user?.id || 'anonymous'
      };
      
      await addDoc(collection(firestore, 'applicants'), applicationData);
      setShowSuccess(true);
      // Refresh application status
      await checkExistingApplication();
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustFeePayment = async () => {
    if (walletBalance < 12) {
      alert('Insufficient wallet balance. Please deposit funds first.');
      return;
    }

    setLoading(true);
    try {
      if (applicationStatus) {
        await updateDoc(doc(firestore, 'applicants', applicationStatus.id), {
          trustFeeStatus: 'paid',
          paymentVerifiedAt: new Date().toISOString()
        });
        setApplicationStatus(prev => prev ? { ...prev, trustFeeStatus: 'paid' } : null);
        setShowPaymentModal(false);
        setShowContactModal(true);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmission = async () => {
    if (!whatsappNumber || !telegramUsername) {
      alert('Please provide both WhatsApp number and Telegram username.');
      return;
    }

    setLoading(true);
    try {
      if (applicationStatus) {
        await updateDoc(doc(firestore, 'applicants', applicationStatus.id), {
          whatsappNumber,
          telegramUsername,
          status: 'approved'
        });
        setApplicationStatus(prev => prev ? { 
          ...prev, 
          whatsappNumber, 
          telegramUsername, 
          status: 'approved' 
        } : null);
        setShowContactModal(false);
        alert('Congratulations! Your application has been approved. Welcome to the team!');
      }
    } catch (error) {
      console.error('Error submitting contact info:', error);
      alert('Failed to submit contact information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter your full name"
          />
          {errors.full_name && <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="your.email@example.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date of Birth <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => handleInputChange('dob', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          {errors.dob && <p className="text-red-400 text-sm mt-1">{errors.dob}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gender <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Country <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Your country"
          />
          {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Street address"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="City"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="State/Province"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn Profile</label>
          <input
            type="url"
            value={formData.linkedin}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Profile</label>
          <input
            type="url"
            value={formData.github}
            onChange={(e) => handleInputChange('github', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://github.com/yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio/Website</label>
          <input
            type="url"
            value={formData.portfolio}
            onChange={(e) => handleInputChange('portfolio', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://yourportfolio.com"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Education & Experience</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Highest Education <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Education Level</option>
            <option value="High School">High School</option>
            <option value="Associate Degree">Associate Degree</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="PhD">PhD</option>
            <option value="Other">Other</option>
          </select>
          {errors.education && <p className="text-red-400 text-sm mt-1">{errors.education}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">University/College</label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => handleInputChange('university', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="University/College name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Graduation Year</label>
          <input
            type="number"
            value={formData.graduation_year}
            onChange={(e) => handleInputChange('graduation_year', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="2020"
            min="1950"
            max="2030"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Total Experience (Years) <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.experience_years}
            onChange={(e) => handleInputChange('experience_years', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Experience</option>
            <option value="0-1">0-1 years</option>
            <option value="1-2">1-2 years</option>
            <option value="2-3">2-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-7">5-7 years</option>
            <option value="7-10">7-10 years</option>
            <option value="10+">10+ years</option>
          </select>
          {errors.experience_years && <p className="text-red-400 text-sm mt-1">{errors.experience_years}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Role <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.current_role}
            onChange={(e) => handleInputChange('current_role', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Your current position"
          />
          {errors.current_role && <p className="text-red-400 text-sm mt-1">{errors.current_role}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Previous Companies</label>
          <input
            type="text"
            value={formData.previous_companies.join(', ')}
            onChange={(e) => handleInputChange('previous_companies', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Company A, Company B, Company C"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Certifications</label>
        <input
          type="text"
          value={formData.certifications.join(', ')}
          onChange={(e) => handleInputChange('certifications', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="AWS Certified, Google Analytics, etc."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Skills & Preferences</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Skills / Technologies <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {skillsOptions.map((skill) => (
            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.skills.includes(skill)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleInputChange('skills', [...formData.skills, skill]);
                  } else {
                    handleInputChange('skills', formData.skills.filter(s => s !== skill));
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-white/5 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">{skill}</span>
            </label>
          ))}
        </div>
        {errors.skills && <p className="text-red-400 text-sm mt-1">{errors.skills}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Role <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.preferred_role}
            onChange={(e) => handleInputChange('preferred_role', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Preferred Role</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {errors.preferred_role && <p className="text-red-400 text-sm mt-1">{errors.preferred_role}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Availability <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.availability}
            onChange={(e) => handleInputChange('availability', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Availability</option>
            {availabilityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.availability && <p className="text-red-400 text-sm mt-1">{errors.availability}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Expected Salary/Rate</label>
          <input
            type="text"
            value={formData.expected_salary}
            onChange={(e) => handleInputChange('expected_salary', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="$5000/month or $50/hour"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Work Location</label>
          <select
            value={formData.work_location}
            onChange={(e) => handleInputChange('work_location', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Select Work Location</option>
            {workLocationOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="GMT+5:30, PST, EST, etc."
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Documents & Motivation</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Resume Upload</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-300">
            <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Upload your resume (PDF, DOC, DOCX)</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-300">
              Choose File
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cover Letter Upload (Optional)</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-300">
            <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Upload your cover letter (PDF, DOC, DOCX)</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              id="cover-letter-upload"
            />
            <label htmlFor="cover-letter-upload" className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-300">
              Choose File
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Why do you want to join us? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.motivation}
          onChange={(e) => handleInputChange('motivation', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Tell us why you want to work with us and what you can bring to the team..."
        />
        {errors.motivation && <p className="text-red-400 text-sm mt-1">{errors.motivation}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Strengths & Weaknesses</label>
        <textarea
          value={formData.strengths_weaknesses}
          onChange={(e) => handleInputChange('strengths_weaknesses', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Describe your key strengths and areas for improvement..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">References</label>
        <input
          type="text"
          value={formData.references.join(', ')}
          onChange={(e) => handleInputChange('references', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Reference 1, Reference 2, Reference 3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio Project Links</label>
        <input
          type="text"
          value={formData.portfolio_projects.join(', ')}
          onChange={(e) => handleInputChange('portfolio_projects', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="https://project1.com, https://project2.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Additional Information</label>
        <textarea
          value={formData.additional_info}
          onChange={(e) => handleInputChange('additional_info', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Any additional information you'd like to share..."
        />
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Personal Info', icon: UserIcon },
    { number: 2, title: 'Education & Experience', icon: AcademicCapIcon },
    { number: 3, title: 'Skills & Preferences', icon: BriefcaseIcon },
    { number: 4, title: 'Documents & Submit', icon: DocumentTextIcon }
  ];

  // Show application status if user has already applied
  if (applicationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Application Status
              </h1>
              <p className="text-xl text-gray-300">
                Track your application progress
              </p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    applicationStatus.status === 'approved' ? 'bg-green-500' :
                    applicationStatus.status === 'rejected' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <h2 className="text-2xl font-bold text-white">Application Status</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  applicationStatus.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  applicationStatus.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {applicationStatus.status.charAt(0).toUpperCase() + applicationStatus.status.slice(1)}
                </span>
              </div>

              {applicationStatus.status === 'pending' && (
                <div className="text-center py-8">
                  <ClockIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Application Under Review</h3>
                  <p className="text-gray-300 mb-6">
                    Our team is reviewing your application. Please wait 24–48 hours for a response.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-300 text-sm">
                      <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
                      We'll notify you once the review is complete.
                    </p>
                  </div>
                </div>
              )}

              {applicationStatus.status === 'reviewed' && applicationStatus.trustFeeStatus === 'pending' && (
                <div className="text-center py-8">
                  <SparklesIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Congratulations!</h3>
                  <p className="text-gray-300 mb-6">
                    Your application has been reviewed and approved! To complete the process, please pay the trust fee.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-semibold">Trust Fee</span>
                      <span className="text-2xl font-bold text-green-400">${applicationStatus.trustFeeAmount}</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      This one-time fee helps us verify your commitment and covers onboarding costs.
                    </p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                    >
                      Pay Trust Fee
                    </button>
                  </div>
                </div>
              )}

              {applicationStatus.trustFeeStatus === 'paid' && !applicationStatus.whatsappNumber && (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Payment Received!</h3>
                  <p className="text-gray-300 mb-6">
                    Your trust fee has been paid successfully. Please provide your contact information to complete the onboarding.
                  </p>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                  >
                    Provide Contact Information
                  </button>
                </div>
              )}

              {applicationStatus.status === 'approved' && applicationStatus.whatsappNumber && (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Welcome to the Team!</h3>
                  <p className="text-gray-300 mb-6">
                    Your application has been fully approved. You're now part of our team!
                  </p>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-gray-400 text-sm">WhatsApp Number</p>
                        <p className="text-white font-semibold">{applicationStatus.whatsappNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Telegram Username</p>
                        <p className="text-white font-semibold">@{applicationStatus.telegramUsername}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {applicationStatus.status === 'rejected' && (
                <div className="text-center py-8">
                  <XMarkIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Application Not Selected</h3>
                  <p className="text-gray-300 mb-6">
                    Thank you for your interest. Unfortunately, we won't be moving forward with your application at this time.
                  </p>
                  {applicationStatus.adminNotes && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-300 text-sm">
                        <strong>Admin Notes:</strong> {applicationStatus.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Pay Trust Fee</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-2xl font-bold text-green-400">$12.00</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="text-white">${walletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold border-t border-white/20 pt-3">
                  <span className="text-white">Remaining</span>
                  <span className={walletBalance >= 12 ? 'text-green-400' : 'text-red-400'}>
                    ${(walletBalance - 12).toFixed(2)}
                  </span>
                </div>
              </div>

              {walletBalance < 12 ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-300 text-sm mb-4">
                    <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
                    Insufficient wallet balance. Please deposit funds first.
                  </p>
                  <button
                    onClick={() => window.location.href = '/wallet'}
                    className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-300"
                  >
                    Go to Wallet
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleTrustFeePayment}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Pay $12.00'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contact Information Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Contact Information</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WhatsApp Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telegram Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="username"
                  />
                </div>

                <button
                  onClick={handleContactSubmission}
                  disabled={loading || !whatsappNumber || !telegramUsername}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Contact Information'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
            <p className="text-gray-300 mb-6">
              Thank you for your interest in working with us. We'll review your application and get back to you within 3-5 business days.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Work With Us
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join our team of talented developers, designers, and professionals. 
            We're looking for passionate individuals who want to make a difference.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  Next
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                  <CheckCircleIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
