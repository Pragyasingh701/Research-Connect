import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Globe, 
  Layers, 
  ListChecks, 
  Calendar, 
  Plus, 
  Trash2 
} from 'lucide-react';
import api from '../../services/api';

const CreateProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchDomain, setResearchDomain] = useState('Computer Science');
  const [researchArea, setResearchArea] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  
  // Objectives array
  const [objectives, setObjectives] = useState(['']);
  const [expectedOutcomes, setExpectedOutcomes] = useState('');

  // Project Settings
  const [type, setType] = useState('Individual');
  const [status, setStatus] = useState('Draft');
  const [visibility, setVisibility] = useState('Public');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const handleAddObjective = () => setObjectives([...objectives, '']);
  const handleObjectiveChange = (index, value) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };
  const handleRemoveObjective = (index) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, idx) => idx !== index));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!title.trim()) return setError('Project Title is required');
      if (!description.trim()) return setError('Project Description is required');
      if (!researchDomain.trim()) return setError('Research Domain is required');
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const keywords = keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const filteredObjectives = objectives.filter(o => o.trim().length > 0);

    const payload = {
      title,
      shortTitle,
      description,
      researchDomain,
      researchArea,
      keywords,
      objectives: filteredObjectives,
      expectedOutcomes,
      type,
      status,
      visibility,
      startDate,
      endDate: endDate || undefined,
    };

    try {
      const response = await api.post('/projects', payload);
      navigate(`/projects/${response.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create research project.');
      setLoading(false);
    }
  };

  const domains = [
    'Computer Science', 'Medicine & Health', 'Physics', 'Chemistry', 
    'Biology', 'Engineering', 'Social Sciences', 'Mathematics', 'Environmental Science'
  ];

  const projectTypes = [
    'Individual', 'Team', 'University', 'Industry', 'Government', 
    'International', 'Open Source', 'Funded', 'Thesis', 'Dissertation'
  ];

  const visibilities = [
    { name: 'Public', desc: 'Anyone on the web can view this project' },
    { name: 'Private', desc: 'Only approved team members can view' },
    { name: 'Institution Only', desc: 'Only researchers in your institution can view' },
    { name: 'Invite Only', desc: 'Access granted via direct owner invitation' }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Create Research Project</h1>
        <p className="text-slate-500 text-sm mt-1">Centralize your researchers, files, tasks, publications, and funding.</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-4 mb-8 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs border ${
            step >= 1 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400'
          }`}>
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="text-xs sm:text-sm">Information</span>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs border ${
            step >= 2 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400'
          }`}>
            {step > 2 ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="text-xs sm:text-sm">Objectives</span>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs border ${
            step >= 3 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400'
          }`}>
            3
          </div>
          <span className="text-xs sm:text-sm">Settings</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-6 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart IoT Monitoring System for Agricultural Yield"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Short Title</label>
                <input
                  type="text"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  placeholder="e.g. IoT-Agri"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Research Domain *</label>
                <select
                  value={researchDomain}
                  onChange={(e) => setResearchDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                >
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Research Area</label>
                <input
                  type="text"
                  value={researchArea}
                  onChange={(e) => setResearchArea(e.target.value)}
                  placeholder="e.g. Precision Agriculture"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="e.g. IoT, Sensors, Yield Prediction"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the research background, methodologies, and overall project goals..."
                rows="5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors resize-none"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Objectives & Expected Outcomes */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-6 text-left">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Project Objectives</label>
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Objective
                </button>
              </div>
              
              <div className="space-y-3">
                {objectives.map((obj, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                      placeholder={`Objective #${idx + 1}`}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                      required
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Expected Outcomes</label>
              <textarea
                value={expectedOutcomes}
                onChange={(e) => setExpectedOutcomes(e.target.value)}
                placeholder="What are the predicted scientific achievements, patents, papers, or deliverables?"
                rows="5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors resize-none"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Settings & Timeline */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                >
                  {projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Expected End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Visibility Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibilities.map((v) => (
                  <label
                    key={v.name}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      visibility === v.name
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm shadow-blue-500/5'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={v.name}
                      checked={visibility === v.name}
                      onChange={() => setVisibility(v.name)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 leading-none">{v.name}</span>
                      <span className="text-xs text-slate-400 mt-1">{v.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Creating Workspace...' : 'Create Workspace'} <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProject;
