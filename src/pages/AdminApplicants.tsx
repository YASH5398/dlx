import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { 
  UserGroupIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Applicant {
  id: string;
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
  education: string;
  university: string;
  graduation_year: string;
  certifications: string[];
  experience_years: string;
  current_role: string;
  previous_companies: string[];
  skills: string[];
  preferred_role: string;
  expected_salary: string;
  availability: string;
  work_location: string;
  timezone: string;
  resume_url: string;
  cover_letter_url: string;
  motivation: string;
  strengths_weaknesses: string;
  references: string[];
  portfolio_projects: string[];
  additional_info: string;
  submitted_at: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'accepted' | 'shortlisted';
  admin_notes?: string;
  trustFeeStatus?: 'pending' | 'paid' | 'verified';
  trustFeeAmount?: number;
  trust_fee_paid?: boolean;
  whatsappNumber?: string;
  telegramUsername?: string;
  reviewedAt?: string;
  paymentVerifiedAt?: string;
  trust_fee_amount?: number;
}

export default function AdminApplicants() {
  const { user } = useUser();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'shortlisted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTrustFeeModal, setShowTrustFeeModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const applicantsQuery = query(collection(firestore, 'applicants'), orderBy('submitted_at', 'desc'));
      const applicantsSnapshot = await getDocs(applicantsQuery);
      const applicantsData = applicantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Applicant[];

      setApplicants(applicantsData);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      // Set sample data for demo
      setApplicants([
        {
          id: '1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          dob: '1990-01-01',
          gender: 'Male',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
          portfolio: 'https://johndoe.dev',
          education: 'Bachelor\'s Degree',
          university: 'MIT',
          graduation_year: '2015',
          certifications: ['AWS Certified', 'Google Analytics'],
          experience_years: '5-7',
          current_role: 'Senior Developer',
          previous_companies: ['Google', 'Microsoft'],
          skills: ['React', 'Node.js', 'Python', 'AWS'],
          preferred_role: 'Full Stack Developer',
          expected_salary: '$8000/month',
          availability: 'Full-time',
          work_location: 'Remote',
          timezone: 'EST',
          resume_url: 'https://example.com/resume.pdf',
          cover_letter_url: 'https://example.com/cover.pdf',
          motivation: 'Passionate about building innovative solutions',
          strengths_weaknesses: 'Strong in React, learning ML',
          references: ['Jane Smith', 'Bob Johnson'],
          portfolio_projects: ['https://project1.com', 'https://project2.com'],
          additional_info: 'Open to relocation',
          submitted_at: '2025-01-25T10:00:00Z',
          status: 'pending'
        },
        {
          id: '2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1 (555) 987-6543',
          dob: '1992-05-15',
          gender: 'Female',
          address: '456 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          linkedin: 'https://linkedin.com/in/janesmith',
          github: 'https://github.com/janesmith',
          portfolio: 'https://janesmith.design',
          education: 'Master\'s Degree',
          university: 'Stanford',
          graduation_year: '2017',
          certifications: ['Figma Certified', 'Adobe Creative Suite'],
          experience_years: '3-5',
          current_role: 'UI/UX Designer',
          previous_companies: ['Apple', 'Facebook'],
          skills: ['Figma', 'Adobe XD', 'Sketch', 'Photoshop'],
          preferred_role: 'UI/UX Designer',
          expected_salary: '$6000/month',
          availability: 'Full-time',
          work_location: 'Hybrid',
          timezone: 'PST',
          resume_url: 'https://example.com/jane-resume.pdf',
          cover_letter_url: '',
          motivation: 'Love creating beautiful user experiences',
          strengths_weaknesses: 'Excellent design skills, improving coding',
          references: ['Alice Brown', 'Charlie Wilson'],
          portfolio_projects: ['https://design1.com', 'https://design2.com'],
          additional_info: 'Available for freelance projects',
          submitted_at: '2025-01-24T14:30:00Z',
          status: 'accepted',
          trust_fee_paid: false,
          trust_fee_amount: 12
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    setProcessing(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_notes: adminNotes,
        processed_at: new Date().toISOString()
      };

      // If status is 'reviewed', set trust fee amount and reviewed date
      if (newStatus === 'reviewed') {
        updateData.trustFeeAmount = 12;
        updateData.trustFeeStatus = 'pending';
        updateData.reviewedAt = new Date().toISOString();
      }

      await updateDoc(doc(firestore, 'applicants', applicantId), updateData);

      setApplicants(prev => prev.map(applicant => 
        applicant.id === applicantId 
          ? { 
              ...applicant, 
              status: newStatus as any, 
              admin_notes: adminNotes,
              ...(newStatus === 'reviewed' && {
                trustFeeAmount: 12,
                trustFeeStatus: 'pending',
                reviewedAt: new Date().toISOString()
              })
            }
          : applicant
      ));

      setShowDetails(false);
      setAdminNotes('');
      alert(`Application ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTrustFeePayment = async (applicantId: string) => {
    setProcessing(true);
    try {
      await updateDoc(doc(firestore, 'applicants', applicantId), {
        trustFeeStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString()
      });

      setApplicants(prev => prev.map(applicant => 
        applicant.id === applicantId 
          ? { ...applicant, trustFeeStatus: 'paid', paymentVerifiedAt: new Date().toISOString() }
          : applicant
      ));

      setShowTrustFeeModal(false);
      alert('Trust fee payment recorded successfully!');
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesFilter = filter === 'all' || applicant.status === filter;
    const matchesSearch = applicant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.preferred_role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-400 bg-orange-400/20';
      case 'reviewed': return 'text-blue-400 bg-blue-400/20';
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'reviewed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'approved': return <CheckCircleIcon className="w-5 h-5" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
        <p className="text-lg">Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Applicants Management
          </h1>
          <p className="text-xl text-gray-300">
            Review and manage job applications from talented professionals
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {applicants.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-gray-400">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {applicants.filter(a => a.status === 'accepted').length}
            </div>
            <div className="text-gray-400">Accepted</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {applicants.filter(a => a.status === 'shortlisted').length}
            </div>
            <div className="text-gray-400">Shortlisted</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {applicants.length}
            </div>
            <div className="text-gray-400">Total Applications</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              className="flex-1 bg-transparent border-b border-white/20 focus:border-blue-400 outline-none text-white text-lg py-2 transition-colors duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-gray-300 font-semibold">Filter by:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'accepted' ? 'bg-green-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('shortlisted')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'shortlisted' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Shortlisted
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'rejected' ? 'bg-red-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Applicants List */}
        <div className="space-y-6">
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No applicants found</h3>
              <p className="text-gray-400">No applicants match the current filter.</p>
            </div>
          ) : (
            filteredApplicants.map((applicant) => (
              <div
                key={applicant.id}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{applicant.full_name}</h3>
                      <p className="text-gray-400 text-sm">{applicant.email}</p>
                      <p className="text-gray-400 text-sm">{applicant.preferred_role} • {applicant.experience_years} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(applicant.status)}`}>
                      {getStatusIcon(applicant.status)}
                      {applicant.status}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setShowDetails(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <PhoneIcon className="w-4 h-4" />
                    <span className="text-sm">{applicant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm">{applicant.city}, {applicant.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    <span className="text-sm">{applicant.expected_salary}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {applicant.skills.slice(0, 5).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                  {applicant.skills.length > 5 && (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                      +{applicant.skills.length - 5} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Applied: {new Date(applicant.submitted_at).toLocaleDateString()}
                  </div>
                  {applicant.status === 'accepted' && !applicant.trust_fee_paid && (
                    <button
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setShowTrustFeeModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                    >
                      Process Trust Fee
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Applicant Details Modal */}
        {showDetails && selectedApplicant && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Applicant Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Info */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Personal Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Full Name:</span>
                      <p className="text-white font-medium">{selectedApplicant.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Email:</span>
                      <p className="text-white font-medium">{selectedApplicant.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Phone:</span>
                      <p className="text-white font-medium">{selectedApplicant.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Location:</span>
                      <p className="text-white font-medium">{selectedApplicant.city}, {selectedApplicant.country}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">LinkedIn:</span>
                      <a href={selectedApplicant.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {selectedApplicant.linkedin}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">GitHub:</span>
                      <a href={selectedApplicant.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {selectedApplicant.github}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Education & Experience */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Education & Experience</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Education:</span>
                      <p className="text-white font-medium">{selectedApplicant.education} - {selectedApplicant.university}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Experience:</span>
                      <p className="text-white font-medium">{selectedApplicant.experience_years} years</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Current Role:</span>
                      <p className="text-white font-medium">{selectedApplicant.current_role}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Skills:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApplicant.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Motivation</h4>
                  <p className="text-gray-300">{selectedApplicant.motivation}</p>
                </div>

                {/* Admin Actions */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Admin Actions</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="Add your notes about this applicant..."
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStatusChange(selectedApplicant.id, 'accepted')}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedApplicant.id, 'shortlisted')}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                      >
                        <StarIcon className="w-5 h-5" />
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedApplicant.id, 'rejected')}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trust Fee Payment Modal */}
        {showTrustFeeModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Trust Fee Payment</h3>
                <button
                  onClick={() => setShowTrustFeeModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Applicant Information</h4>
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="text-gray-400">Name:</span> {selectedApplicant.full_name}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Email:</span> {selectedApplicant.email}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Role:</span> {selectedApplicant.preferred_role}</p>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-green-400 mb-4">Trust Fee Details</h4>
                  <div className="space-y-2">
                    <p className="text-gray-300">Amount: <span className="text-green-400 font-semibold">$12.00</span></p>
                    <p className="text-gray-300">Purpose: Trust fee for accepted applicant</p>
                    <p className="text-gray-300">Status: <span className="text-orange-400">Pending Payment</span></p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-blue-400 mb-4">Payment Instructions</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>1. Contact the applicant to inform them about the trust fee</p>
                    <p>2. Provide payment instructions (PayPal, Bank Transfer, etc.)</p>
                    <p>3. Once payment is received, mark it as paid below</p>
                    <p>4. The applicant will then be fully onboarded</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowTrustFeeModal(false)}
                    className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleTrustFeePayment(selectedApplicant.id)}
                    disabled={processing}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Mark as Paid'}
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
