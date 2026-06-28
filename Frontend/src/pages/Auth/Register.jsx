import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  ChevronRight, 
  ChevronLeft, 
  GraduationCap, 
  Briefcase, 
  HeartPulse, 
  Sparkles,
  Link2,
  FileSpreadsheet
} from 'lucide-react';
import Input from '@/components/common/Input.jsx';
import Button from '@/components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext';

const RegisterWizard = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Main Wizard State holding all collected data
  const [formData, setFormData] = useState({
    // Step 1: Login choice (email vs google)
    // Step 2: Researcher Type
    researcherType: 'academic',
    // Step 3: Institutional details
    institution: '',
    isIndependent: false,
    department: '',
    designation: '',
    country: '',
    state: '',
    city: '',
    // Step 4: Account Credentials
    firstName: '',
    lastName: '',
    email: '',
    alternativeEmail: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    // Step 5: Academic Accounts
    googleScholarId: '',
    orcidId: '',
    linkedinUrl: '',
    scopusId: '',
    researchGateUrl: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleIndependentChange = (e) => {
    const isChecked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isIndependent: isChecked,
      institution: isChecked ? 'Independent Researcher' : '',
    }));
  };

  const validateStep = (currentStep) => {
    const tempErrors = {};
    if (currentStep === 2) {
      if (!formData.researcherType) {
        tempErrors.researcherType = 'Please select a researcher category';
      }
    }
    if (currentStep === 3) {
      if (!formData.isIndependent && !formData.institution) {
        tempErrors.institution = 'Institution name is required';
      }
      if (!formData.country) {
        tempErrors.country = 'Country is required';
      }
    }
    if (currentStep === 4) {
      if (!formData.firstName) tempErrors.firstName = 'First Name is required';
      if (!formData.lastName) tempErrors.lastName = 'Last Name is required';
      
      if (!formData.email) {
        tempErrors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        tempErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.password) {
        tempErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        tempErrors.password = 'Password must be at least 8 characters long';
      } else if (!/\d/.test(formData.password)) {
        tempErrors.password = 'Password must contain at least one number';
      } else if (!/[A-Z]/.test(formData.password)) {
        tempErrors.password = 'Password must contain at least one uppercase letter';
      }

      if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.agreeTerms) {
        tempErrors.agreeTerms = 'You must accept the Terms & Conditions';
      }
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) {
      setStep(4);
      return;
    }

    setIsLoading(true);
    setApiError('');

    const fullName = `${formData.firstName} ${formData.lastName}`;
    const result = await register(
      fullName,
      formData.email,
      formData.password,
      'researcher',
      {
        researcherType: formData.researcherType,
        institution: formData.institution,
        department: formData.department,
        designation: formData.designation,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        googleScholarId: formData.googleScholarId,
        orcidId: formData.orcidId,
        linkedinUrl: formData.linkedinUrl,
        scopusId: formData.scopusId,
        researchGateUrl: formData.researchGateUrl,
      }
    );

    if (result.success) {
      navigate(`/verify-otp?email=${encodeURIComponent(result.email)}&purpose=email_verification`);
    } else {
      setApiError(result.error || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Helper to render step indicators
  const renderStepHeader = () => {
    if (step === 1 || step > 6) return null;
    const progressPercentage = ((step - 2) / 4) * 100;
    return (
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-text-secondary)]">
          <span>Step {step - 1} of 5</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-xl mx-auto py-4">
      {renderStepHeader()}

      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/35 text-[var(--color-brand-red)] rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* STEP 1: Welcome Screen */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-display text-[var(--color-brand-text-primary)]">Join ResearchConnect</h3>
            <p className="text-sm text-[var(--color-brand-text-secondary)]">
              Create your professional research identity and collaborate with researchers worldwide.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
            >
              Get Started
            </button>
          </div>

          <div className="border-t border-[var(--color-brand-border)] pt-4 text-center">
            <p className="text-xs text-[var(--color-brand-text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--color-brand-blue)] hover:underline font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Researcher Type */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">What type of researcher are you?</h3>
            <p className="text-xs text-[var(--color-brand-text-secondary)]">Choose the profile description that fits you best.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: 'academic',
                title: 'Academic or Student',
                desc: 'University students, professors, faculty members, and research scholars.',
                icon: GraduationCap,
              },
              {
                id: 'corporate',
                title: 'Corporate / Government',
                desc: 'R&D specialists, technology professionals, and government scientists.',
                icon: Briefcase,
              },
              {
                id: 'medical',
                title: 'Medical Researcher',
                desc: 'Doctors, clinicians, healthcare professionals, and medical scientists.',
                icon: HeartPulse,
              },
              {
                id: 'citizen',
                title: 'Not a Researcher',
                desc: 'Journalists, citizen scientists, observers, or readers.',
                icon: User,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = formData.researcherType === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setFormData(p => ({ ...p, researcherType: item.id }))}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col gap-3 ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/20 shadow-sm shadow-blue-500/5' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" className="px-5">Back</Button>
            <Button onClick={handleNext} className="px-6">Next <ChevronRight className="w-4 h-4 ml-1.5" /></Button>
          </div>
        </div>
      )}

      {/* STEP 3: Institution Info */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">Show where you conduct research</h3>
            <p className="text-xs text-[var(--color-brand-text-secondary)]">Enter details to connect with institutional colleagues.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="isIndependent"
                name="isIndependent"
                checked={formData.isIndependent}
                onChange={handleIndependentChange}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isIndependent" className="text-xs font-semibold text-slate-600 cursor-pointer">
                I conduct research independently (No institution affiliation)
              </label>
            </div>

            {!formData.isIndependent && (
              <div className="relative">
                <Input
                  label="Institution Name"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  error={errors.institution}
                  placeholder="e.g. Indian Institute of Technology, Delhi"
                  required
                  className="pl-10"
                />
                <Building className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
              />
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Research Fellow"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                error={errors.country}
                placeholder="India"
                required
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Delhi"
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New Delhi"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" className="px-5">Back</Button>
            <Button onClick={handleNext} className="px-6">Next <ChevronRight className="w-4 h-4 ml-1.5" /></Button>
          </div>
        </div>
      )}

      {/* STEP 4: Credentials Details */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">Create your account credentials</h3>
            <p className="text-xs text-[var(--color-brand-text-secondary)]">Complete details to secure your profile access.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="Sarah"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="Jenkins"
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Institutional Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="sarah.jenkins@stanford.edu"
                required
                className="pl-10"
              />
              <Mail className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
            </div>

            <div className="relative">
              <Input
                label="Alternative Email (Optional)"
                type="email"
                name="alternativeEmail"
                value={formData.alternativeEmail}
                onChange={handleChange}
                placeholder="sarah.personal@gmail.com"
                className="pl-10"
              />
              <Mail className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agreeTerms" className="text-xs text-slate-500 leading-normal cursor-pointer">
                I agree to the <span className="text-blue-600 hover:underline">Terms of Service</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>.
                {errors.agreeTerms && <p className="text-red-500 font-semibold mt-0.5">{errors.agreeTerms}</p>}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" className="px-5">Back</Button>
            <Button onClick={handleNext} className="px-6">Next <ChevronRight className="w-4 h-4 ml-1.5" /></Button>
          </div>
        </div>
      )}

      {/* STEP 5: Link Academic Profiles */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">Link your academic profiles</h3>
            <p className="text-xs text-[var(--color-brand-text-secondary)]">Import your publications, citations, and stats automatically.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Google Scholar
              </label>
              <input
                type="text"
                name="googleScholarId"
                value={formData.googleScholarId}
                onChange={handleChange}
                placeholder="Author ID (e.g. LsR1t3AAAAAJ) or Scholar URL"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-lime-600" /> ORCID Identity
              </label>
              <input
                type="text"
                name="orcidId"
                value={formData.orcidId}
                onChange={handleChange}
                placeholder="ORCID iD (e.g. 0000-0002-1825-0097)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Link2 className="w-4 h-4 text-sky-600" /> LinkedIn
              </label>
              <input
                type="text"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="Profile URL"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  Scopus
                </label>
                <input
                  type="text"
                  name="scopusId"
                  value={formData.scopusId}
                  onChange={handleChange}
                  placeholder="Author ID"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  ResearchGate
                </label>
                <input
                  type="text"
                  name="researchGateUrl"
                  value={formData.researchGateUrl}
                  onChange={handleChange}
                  placeholder="Profile URL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" className="px-5">Back</Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => setStep(6)} variant="outline" className="px-4">Skip</Button>
              <Button onClick={handleNext} className="px-6">Continue <ChevronRight className="w-4 h-4 ml-1.5" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Review Summary */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">Review Profile Details</h3>
            <p className="text-xs text-[var(--color-brand-text-secondary)]">Confirm all details before registering your profile.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-sm font-sans space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Researcher Name</span>
              <span className="font-semibold text-slate-800">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Researcher Category</span>
              <span className="font-semibold text-slate-800 capitalize">{formData.researcherType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Institution Affiliation</span>
              <span className="font-semibold text-slate-800">{formData.institution || 'Independent Researcher'}</span>
            </div>
            {formData.department && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-semibold text-slate-800">{formData.department}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Institution Email</span>
              <span className="font-semibold text-slate-800">{formData.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Country / Region</span>
              <span className="font-semibold text-slate-800">{formData.country}</span>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Connected Accounts</span>
              <div className="flex flex-wrap gap-2">
                {formData.googleScholarId && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold">Google Scholar</span>
                )}
                {formData.orcidId && (
                  <span className="px-2 py-1 bg-lime-50 text-lime-700 border border-lime-100 rounded-lg text-[10px] font-bold">ORCID</span>
                )}
                {formData.linkedinUrl && (
                  <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-[10px] font-bold">LinkedIn</span>
                )}
                {!formData.googleScholarId && !formData.orcidId && !formData.linkedinUrl && (
                  <span className="text-xs text-slate-400 italic">No external accounts connected.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" className="px-5">Back</Button>
            <Button 
              onClick={handleSubmit} 
              isLoading={isLoading} 
              className="px-6 bg-green-600 hover:bg-green-700 text-white"
            >
              Create Account <CheckCircle2 className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 7: Verification Success Gate */}
      {step === 7 && (
        <div className="text-center space-y-6 py-10">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-md">
            <Mail className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-display text-slate-900">Verify your email address</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              We have sent a verification link to <span className="font-semibold text-slate-800">{formData.email}</span>. Please click the link inside your inbox to activate your account.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-6 max-w-xs mx-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => alert('Verification email resent successfully.')}
              className="w-full py-2 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Resend verification email
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterWizard;
