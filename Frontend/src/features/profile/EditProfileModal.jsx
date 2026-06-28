import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Link2 } from 'lucide-react';
import api from '../../services/api';

const EditProfileModal = ({ isOpen, onClose, initialData, onSaveSuccess }) => {
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [formData, setFormData] = useState({
    displayName: '',
    headline: '',
    bio: '',
    designation: '',
    department: '',
    institution: '',
    country: '',
    state: '',
    city: '',
    highestQualification: '',
    experience: 0,
    phone: '',
    website: '',
    gender: 'prefer-not-to-say',
    languages: [],
    employmentStatus: 'employed',
    profileVisibility: 'public',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
      researchgate: '',
      orcid: ''
    }
  });

  const [educationList, setEducationList] = useState([]);
  const [experienceList, setExperienceList] = useState([]);
  
  // States for adding new entries
  const [newEdu, setNewEdu] = useState({ degree: '', university: '', fieldOfStudy: '', startYear: 2020, endYear: 2024, grade: '', description: '' });
  const [newExp, setNewExp] = useState({ organization: '', role: '', department: '', employmentType: 'full-time', researchArea: '', startYear: 2020, endYear: null, isCurrent: true, description: '' });
  
  // Publications states
  const [pubList, setPubList] = useState([]);
  const [newPub, setNewPub] = useState({ title: '', abstract: '', journal: '', publisher: '', publicationYear: 2026, publicationType: 'journal', authors: '', volume: '', issue: '', pages: '', publicationUrl: '', pdfUrl: '', doi: '' });
  const [editingPubId, setEditingPubId] = useState(null);

  // Research Interests states
  const [keywordsInput, setKeywordsInput] = useState('');
  const [areasInput, setAreasInput] = useState('');

  const [orcidInput, setOrcidInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [scopusInput, setScopusInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileHistory, setProfileHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/profile/history');
      setProfileHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load profile history:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'history' && isOpen) {
      fetchHistory();
    }
  }, [activeSubTab, isOpen]);

  const handleRollback = async (version) => {
    if (window.confirm(`Are you sure you want to rollback to version ${version}?`)) {
      try {
        const response = await api.post('/profile/rollback', { version });
        alert(response.data.message);
        onSaveSuccess();
        onClose();
      } catch (err) {
        alert(err.response?.data?.message || 'Rollback failed');
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName || '',
        headline: initialData.headline || '',
        bio: initialData.bio || '',
        designation: initialData.designation || '',
        department: initialData.department || '',
        institution: initialData.institution || '',
        country: initialData.country || '',
        state: initialData.state || '',
        city: initialData.city || '',
        highestQualification: initialData.highestQualification || '',
        experience: initialData.experience || 0,
        phone: initialData.phone || '',
        website: initialData.website || '',
        gender: initialData.gender || 'prefer-not-to-say',
        languages: initialData.languages || [],
        employmentStatus: initialData.employmentStatus || 'employed',
        profileVisibility: initialData.profileVisibility || 'public',
        socialLinks: {
          linkedin: initialData.socialLinks?.linkedin || '',
          twitter: initialData.socialLinks?.twitter || '',
          github: initialData.socialLinks?.github || '',
          researchgate: initialData.socialLinks?.researchgate || '',
          orcid: initialData.socialLinks?.orcid || ''
        }
      });
      setEducationList(initialData.educationList || []);
      setExperienceList(initialData.experienceList || []);
      
      if (initialData.researchAreas) {
        setAreasInput(initialData.researchAreas.map(a => a.researchArea?.areaName).filter(Boolean).join(', '));
      }
      if (initialData.keywords) {
        setKeywordsInput(initialData.keywords.map(k => k.keyword?.keyword).filter(Boolean).join(', '));
      }
      setPubList(initialData.publications || []);

      setOrcidInput(initialData.academicProfile?.orcid || '');
      setLinkedinInput(initialData.academicProfile?.linkedIn || '');
      setScopusInput(initialData.academicProfile?.scopusId || '');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch('/profile', formData);
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  // Education Helpers
  const handleAddEducation = async () => {
    try {
      const response = await api.patch('/profile/education', newEdu);
      setEducationList((prev) => [...prev, response.data.data]);
      setNewEdu({ degree: '', university: '', fieldOfStudy: '', startYear: 2020, endYear: 2024, grade: '', description: '' });
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add education record');
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await api.delete(`/profile/education/${id}`);
      setEducationList((prev) => prev.filter(e => e._id !== id));
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete education record');
    }
  };

  // Experience Helpers
  const handleAddExperience = async () => {
    try {
      const response = await api.patch('/profile/experience', newExp);
      setExperienceList((prev) => [...prev, response.data.data]);
      setNewExp({ organization: '', role: '', department: '', employmentType: 'full-time', researchArea: '', startYear: 2020, endYear: null, isCurrent: true, description: '' });
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add experience record');
    }
  };

  // Publication Helpers
  const handleSavePublication = async () => {
    try {
      const payload = { ...newPub };
      if (editingPubId) payload.id = editingPubId;

      const response = await api.patch('/profile/publications', payload);
      const savedPub = response.data.data;

      if (editingPubId) {
        setPubList((prev) => prev.map((p) => p._id === editingPubId ? savedPub : p));
        setEditingPubId(null);
      } else {
        setPubList((prev) => [...prev, savedPub]);
      }

      setNewPub({ title: '', abstract: '', journal: '', publisher: '', publicationYear: 2026, publicationType: 'journal', authors: '', volume: '', issue: '', pages: '', publicationUrl: '', pdfUrl: '', doi: '' });
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save publication');
    }
  };

  const handleEditPubClick = (pub) => {
    setEditingPubId(pub._id);
    setNewPub({
      title: pub.title || '',
      abstract: pub.abstract || '',
      journal: pub.journal || '',
      publisher: pub.publisher || '',
      publicationYear: pub.publicationYear || 2026,
      publicationType: pub.publicationType || 'journal',
      authors: pub.authors ? pub.authors.map(a => a.authorName).join(', ') : '',
      volume: pub.volume || '',
      issue: pub.issue || '',
      pages: pub.pages || '',
      publicationUrl: pub.publicationUrl || '',
      pdfUrl: pub.pdfUrl || '',
      doi: pub.doi || '',
    });
  };

  // Research Interests Helpers
  const handleSaveResearch = async () => {
    try {
      const researchAreas = areasInput.split(',').map(s => s.trim()).filter(Boolean);
      const keywords = keywordsInput.split(',').map(s => s.trim()).filter(Boolean);

      const response = await api.patch('/profile/research', { researchAreas, keywords });
      alert(response.data.message);
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save research interests');
    }
  };

  const handleDeleteExperience = async (id) => {
    try {
      await api.delete(`/profile/experience/${id}`);
      setExperienceList((prev) => prev.filter(e => e._id !== id));
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete experience record');
    }
  };

  // Identities Linkers
  const handleLinkIdentity = async (provider) => {
    try {
      let endpoint = '';
      let payload = {};
      if (provider === 'orcid') {
        endpoint = '/profile/import/orcid';
        payload = { orcidId: orcidInput };
      } else if (provider === 'linkedin') {
        endpoint = '/profile/import/linkedin';
        payload = { linkedinUrl: linkedinInput };
      } else if (provider === 'scopus') {
        endpoint = '/profile/scopus';
        payload = { scopusId: scopusInput };
      }
      
      const response = await api.post(endpoint, payload);
      alert(response.data.message);
      onSaveSuccess();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to link ${provider}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Research Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize your personal bio, employment status, academic history, and external identities.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-slate-50/50 border-b border-slate-100 px-6 py-2 overflow-x-auto gap-2 shrink-0">
          {['basic', 'academic', 'education', 'experience', 'publications', 'research', 'identities', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                activeSubTab === tab 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'identities' 
                ? 'Academic Identities' 
                : tab === 'history'
                ? 'Revision History'
                : tab === 'publications'
                ? 'Publications CV'
                : tab === 'research'
                ? 'Research Interests'
                : `${tab} Info`}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto text-left space-y-6">
          {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium">{error}</div>}

          {/* BASIC TAB */}
          {activeSubTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Display Name</label>
                <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Dr. Sarah Jenkins" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Headline</label>
                <input type="text" name="headline" value={formData.headline} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. AI Researcher | Postdoctoral Fellow at Stanford" />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Biography</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Tell other researchers about your research focuses, lab work, or academic achievements..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="+1 555-0199" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Website</label>
                <input type="text" name="website" value={formData.website} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="https://sarahjenkins.lab.stanford.edu" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="United States" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">State / City</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="California" />
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Stanford" />
                </div>
              </div>
            </div>
          )}

          {/* ACADEMIC TAB */}
          {activeSubTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Highest Qualification</label>
                <input type="text" name="highestQualification" value={formData.highestQualification} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Ph.D. in Computer Science" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Institution</label>
                <input type="text" name="institution" value={formData.institution} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Stanford University" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Department of Computer Science" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Postdoctoral Fellow" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Employment Status</label>
                <select name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">
                  <option value="employed">Employed</option>
                  <option value="student">Student</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Profile Visibility</label>
                <select name="profileVisibility" value={formData.profileVisibility} onChange={handleInputChange} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">
                  <option value="public">Public</option>
                  <option value="restricted">Restricted to Registered Users</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeSubTab === 'education' && (
            <div className="space-y-6">
              {/* Existing Education list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Academic Timeline</h4>
                {educationList.length === 0 ? (
                  <p className="text-xs text-slate-400">No education entries added yet. Fill the form below to add one.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                    {educationList.map((edu) => (
                      <div key={edu._id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                          <p className="text-xs text-slate-500">{edu.university} • {edu.startYear} - {edu.endYear || 'Present'}</p>
                        </div>
                        <button onClick={() => handleDeleteEducation(edu._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Education */}
              <div className="border border-blue-100 rounded-3xl p-5 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 space-y-4">
                <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Academic Credential</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <input type="text" placeholder="Degree (e.g. Master of Science)" value={newEdu.degree} onChange={(e) => setNewEdu(prev => ({ ...prev, degree: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <input type="text" placeholder="University (e.g. MIT)" value={newEdu.university} onChange={(e) => setNewEdu(prev => ({ ...prev, university: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <input type="text" placeholder="Field of Study (e.g. Computational Genetics)" value={newEdu.fieldOfStudy} onChange={(e) => setNewEdu(prev => ({ ...prev, fieldOfStudy: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Start Year" value={newEdu.startYear} onChange={(e) => setNewEdu(prev => ({ ...prev, startYear: parseInt(e.target.value) }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                    <input type="number" placeholder="End Year" value={newEdu.endYear || ''} onChange={(e) => setNewEdu(prev => ({ ...prev, endYear: parseInt(e.target.value) }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  </div>
                </div>
                <button onClick={handleAddEducation} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Save Credential
                </button>
              </div>
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeSubTab === 'experience' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Employment History</h4>
                {experienceList.length === 0 ? (
                  <p className="text-xs text-slate-400">No employment experiences added yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                    {experienceList.map((exp) => (
                      <div key={exp._id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{exp.role}</p>
                          <p className="text-xs text-slate-500">{exp.organization} • {exp.startYear} - {exp.endYear || 'Present'} ({exp.employmentType})</p>
                        </div>
                        <button onClick={() => handleDeleteExperience(exp._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Experience */}
              <div className="border border-indigo-100 rounded-3xl p-5 bg-gradient-to-r from-indigo-50/20 to-purple-50/20 space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Experience Record</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <input type="text" placeholder="Organization / Company" value={newExp.organization} onChange={(e) => setNewExp(prev => ({ ...prev, organization: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <input type="text" placeholder="Role (e.g. Senior Researcher)" value={newExp.role} onChange={(e) => setNewExp(prev => ({ ...prev, role: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <input type="text" placeholder="Department" value={newExp.department} onChange={(e) => setNewExp(prev => ({ ...prev, department: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  <select value={newExp.employmentType} onChange={(e) => setNewExp(prev => ({ ...prev, employmentType: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="postdoc">Postdoctoral Researcher</option>
                    <option value="contract">Contract</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Start Year" value={newExp.startYear} onChange={(e) => setNewExp(prev => ({ ...prev, startYear: parseInt(e.target.value) }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                    <input type="number" placeholder="End Year (Leave empty if current)" value={newExp.endYear || ''} onChange={(e) => setNewExp(prev => ({ ...prev, endYear: e.target.value ? parseInt(e.target.value) : null }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
                  </div>
                </div>
                <button onClick={handleAddExperience} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Save Experience
                </button>
              </div>
            </div>
          )}

          {/* IDENTITIES TAB */}
          {activeSubTab === 'identities' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Connect Academic Accounts</h4>
              
              {/* ORCID */}
              <div className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">ORCID Identifier</p>
                  <p className="text-xs text-slate-400">Synchronize employment, awards, and works.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="0000-0002-1825-0097" value={orcidInput} onChange={(e) => setOrcidInput(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs w-48 bg-slate-50" />
                  <button onClick={() => handleLinkIdentity('orcid')} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"><Link2 className="w-3.5 h-3.5" /> Link</button>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">LinkedIn Profile</p>
                  <p className="text-xs text-slate-400">Link profile summary, experience, and education details.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="https://linkedin.com/in/username" value={linkedinInput} onChange={(e) => setLinkedinInput(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs w-48 bg-slate-50" />
                  <button onClick={() => handleLinkIdentity('linkedin')} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"><Link2 className="w-3.5 h-3.5" /> Link</button>
                </div>
              </div>

              {/* Scopus */}
              <div className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">Scopus Author ID</p>
                  <p className="text-xs text-slate-400">Lock citation counts and Scopus research scores.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="57204859344" value={scopusInput} onChange={(e) => setScopusInput(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs w-48 bg-slate-50" />
                  <button onClick={() => handleLinkIdentity('scopus')} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"><Link2 className="w-3.5 h-3.5" /> Link</button>
                </div>
              </div>
            </div>
          )}

          {/* PUBLICATIONS TAB */}
          {activeSubTab === 'publications' && (
            <div className="space-y-6">
              {/* Existing Publications List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Publications Curriculum Vitae</h4>
                {pubList.length === 0 ? (
                  <p className="text-xs text-slate-400">No publications added yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 max-h-60 overflow-y-auto">
                    {pubList.map((pub) => (
                      <div key={pub._id} className="p-4 flex items-center justify-between gap-4 bg-white">
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-900 truncate">{pub.title}</p>
                          <p className="text-xs text-slate-500 truncate">{pub.journal || pub.publisher || 'Unknown Venue'} • {pub.publicationYear}</p>
                        </div>
                        <button 
                          onClick={() => handleEditPubClick(pub)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add/Edit Publication Form */}
              <div className="border border-blue-100 rounded-3xl p-5 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 space-y-4">
                <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                  {editingPubId ? 'Edit Publication Details' : 'Add New Publication'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <input 
                      type="text" 
                      placeholder="Publication Title" 
                      value={newPub.title} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, title: e.target.value }))} 
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <textarea 
                      placeholder="Abstract / Snippet Description" 
                      value={newPub.abstract} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, abstract: e.target.value }))} 
                      rows={2}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Authors (comma-separated, e.g. Sarah Jenkins, John Doe)" 
                    value={newPub.authors} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, authors: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Journal / Conference Venue" 
                    value={newPub.journal} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, journal: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Publisher (e.g. Springer, IEEE)" 
                    value={newPub.publisher} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, publisher: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      placeholder="Year" 
                      value={newPub.publicationYear} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, publicationYear: parseInt(e.target.value) || 2026 }))} 
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                    />
                    <select 
                      value={newPub.publicationType} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, publicationType: e.target.value }))} 
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="journal">Journal</option>
                      <option value="conference">Conference</option>
                      <option value="book">Book</option>
                      <option value="book-chapter">Book Chapter</option>
                      <option value="patent">Patent</option>
                      <option value="thesis">Thesis</option>
                      <option value="preprint">Preprint</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Volume" 
                    value={newPub.volume} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, volume: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Issue" 
                      value={newPub.issue} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, issue: e.target.value }))} 
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                    />
                    <input 
                      type="text" 
                      placeholder="Pages (e.g. 100-115)" 
                      value={newPub.pages} 
                      onChange={(e) => setNewPub(prev => ({ ...prev, pages: e.target.value }))} 
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="DOI (e.g. 10.1016/j.jbi.2026.104230)" 
                    value={newPub.doi} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, doi: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Publication URL" 
                    value={newPub.publicationUrl} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, publicationUrl: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="PDF Document URL" 
                    value={newPub.pdfUrl} 
                    onChange={(e) => setNewPub(prev => ({ ...prev, pdfUrl: e.target.value }))} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white md:col-span-2" 
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {editingPubId && (
                    <button 
                      onClick={() => {
                        setEditingPubId(null);
                        setNewPub({ title: '', abstract: '', journal: '', publisher: '', publicationYear: 2026, publicationType: 'journal', authors: '', volume: '', issue: '', pages: '', publicationUrl: '', pdfUrl: '', doi: '' });
                      }} 
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button 
                    onClick={handleSavePublication} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {editingPubId ? 'Update Publication' : 'Add Publication'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESEARCH INTERESTS TAB */}
          {activeSubTab === 'research' && (
            <div className="space-y-6 text-left">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Research Interests & Focuses</h4>
              <p className="text-xs text-slate-400">Add keywords and research areas separated by commas to customize your profile's focus.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Research Areas (e.g. Machine Learning, Biostatistics, Cardiology)</label>
                <input 
                  type="text" 
                  value={areasInput} 
                  onChange={(e) => setAreasInput(e.target.value)} 
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:border-blue-600 focus:outline-none"
                  placeholder="Machine Learning, Healthcare AI, Distributed Systems" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Keywords (e.g. deep learning, transformer, federated learning)</label>
                <input 
                  type="text" 
                  value={keywordsInput} 
                  onChange={(e) => setKeywordsInput(e.target.value)} 
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:border-blue-600 focus:outline-none"
                  placeholder="deep learning, nlp, medical scan segmentation" 
                />
              </div>

              <button 
                onClick={handleSaveResearch} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10"
              >
                Save Research Focuses
              </button>
            </div>
          )}

          {/* REVISION HISTORY TAB */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Revision History & Rollbacks</h4>
              {profileHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No revisions found.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                  {profileHistory.map((hist) => (
                    <div key={hist._id} className="p-4 flex items-center justify-between gap-4 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Version {hist.version}</p>
                        <p className="text-xs text-slate-500">{hist.changeSummary} • {new Date(hist.createdAt).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRollback(hist.version)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Rollback
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:bg-blue-400"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;
