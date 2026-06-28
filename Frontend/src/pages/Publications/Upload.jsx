import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Save,
  FileText,
  Upload as UploadIcon,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Share2,
  Copy,
  Info,
  Layers,
  BookOpen,
  Calendar,
  Globe,
  DollarSign,
  Briefcase,
  Terminal,
  HelpCircle,
  FileCode,
  Sparkles,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import api from '../../services/api';

const UploadPublication = () => {
  const navigate = useNavigate();

  // Step state (1 to 7)
  const [step, setStep] = useState(1);
  
  // Dynamic metadata from backend
  const [publicationTypes, setPublicationTypes] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  
  // Search and selector states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState(null); // Full type object
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [newFormatForm, setNewFormatForm] = useState(false);
  const [newFormatData, setNewFormatData] = useState({ name: '', category: 'published-research', description: '' });

  // DOI Lookup state
  const [doiQuery, setDoiQuery] = useState('');
  const [fetchingDoi, setFetchingDoi] = useState(false);
  const [doiError, setDoiError] = useState('');

  // Form Data States
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    abstract: '',
    publicationDate: new Date().toISOString().split('T')[0],
    publicationYear: new Date().getFullYear(),
    language: 'English',
    country: '',
    doi: '',
    fundingInfo: '',
    grantNumber: '',
    license: 'CC-BY-4.0',
    version: 1,
    visibility: 'public',
    commentsEnabled: true,
  });

  // Specific dynamic fields
  const [specificFields, setSpecificFields] = useState({});

  // Authors State
  const [authors, setAuthors] = useState([
    { displayName: '', email: '', institution: '', department: '', country: '', orcid: '', correspondingAuthor: true, authorOrder: 1, isMe: true }
  ]);

  // Metadata Tags State
  const [keywordsInput, setKeywordsInput] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [researchAreasInput, setResearchAreasInput] = useState('');
  const [selectedResearchAreas, setSelectedResearchAreas] = useState([]);
  const [suggestedResearchAreas, setSuggestedResearchAreas] = useState([]);
  
  // Files States
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [files, setFiles] = useState([]); // Array of { file, progress, id, url, name, size }
  const [uploadError, setUploadError] = useState('');

  // Submission States
  const [saving, setSaving] = useState(false);
  const [createdPubId, setCreatedPubId] = useState('');
  const [createdPubDoi, setCreatedPubDoi] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [copied, setCopied] = useState(false);

  // Drag and Drop Author State
  const [draggedAuthorIndex, setDraggedAuthorIndex] = useState(null);

  // Load publication types and licenses on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [typesRes, licensesRes] = await Promise.all([
          api.get('/publications/types'),
          api.get('/publications/licenses')
        ]);
        setPublicationTypes(typesRes.data.data.types);
        setLicenses(licensesRes.data.data.licenses);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchMetadata();
  }, []);

  // Sync year when date changes
  useEffect(() => {
    if (formData.publicationDate) {
      setFormData(prev => ({
        ...prev,
        publicationYear: new Date(formData.publicationDate).getFullYear()
      }));
    }
  }, [formData.publicationDate]);

  // Search filter for format selector
  const filteredTypes = publicationTypes.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Handler for category selection in Step 1
  const handleCategorySelect = (categorySlug) => {
    // Some categories map directly to a single format
    if (categorySlug === 'preprint') {
      const type = publicationTypes.find(t => t.slug === 'preprint');
      selectFormat(type);
    } else if (categorySlug === 'presentation') {
      const type = publicationTypes.find(t => t.slug === 'presentation');
      selectFormat(type);
    } else if (categorySlug === 'poster') {
      const type = publicationTypes.find(t => t.slug === 'poster');
      selectFormat(type);
    } else {
      // Open selector modal filtered by category
      setSelectedCategory(categorySlug);
      setShowFormatModal(true);
    }
  };

  const selectFormat = (type) => {
    if (!type) return;
    setSelectedType(type);
    
    // Initialize specific fields based on type
    const initialSpecifics = {};
    type.specificFields.forEach(f => {
      initialSpecifics[f.name] = f.type === 'boolean' ? false : '';
    });
    setSpecificFields(initialSpecifics);

    setShowFormatModal(false);
    setSearchQuery('');
    setStep(3); // Go to form step
  };

  // DOI Metadata fetch
  const handleFetchDoi = async () => {
    if (!doiQuery.trim()) return;
    setFetchingDoi(true);
    setDoiError('');
    try {
      const response = await api.get(`/publications/metadata/doi?doi=${encodeURIComponent(doiQuery)}`);
      const meta = response.data.data;
      
      setFormData(prev => ({
        ...prev,
        title: meta.title || prev.title,
        abstract: meta.abstract || prev.abstract,
        publisher: meta.publisher || prev.publisher,
        journal: meta.journal || prev.journal,
        publicationYear: meta.publicationYear || prev.publicationYear,
        doi: doiQuery.trim()
      }));

      if (meta.authors && meta.authors.length > 0) {
        setAuthors(meta.authors.map((a, index) => ({
          displayName: a.displayName || a.authorName,
          email: '',
          institution: a.institution || '',
          department: '',
          country: '',
          orcid: '',
          correspondingAuthor: index === 0,
          authorOrder: index + 1,
          isMe: index === 0
        })));
      }
    } catch (err) {
      setDoiError('Failed to fetch metadata for this DOI. You can enter details manually.');
    } finally {
      setFetchingDoi(false);
    }
  };

  // Input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecificFieldChange = (name, value) => {
    setSpecificFields(prev => ({ ...prev, [name]: value }));
  };

  // Cover Image
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover image must be smaller than 5MB');
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Multiple Files Upload handlers
  const handleFileChange = (e) => {
    const filesList = Array.from(e.target.files);
    addFiles(filesList);
  };

  const addFiles = (filesList) => {
    setUploadError('');
    const validFiles = [];
    
    for (const file of filesList) {
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 50MB limit.`);
        continue;
      }
      validFiles.push({
        file,
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        progress: 0
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag and Drop handlers for file zone
  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    const filesList = Array.from(e.dataTransfer.files);
    addFiles(filesList);
  };

  // Authors Management
  const handleAddAuthor = () => {
    setAuthors(prev => [
      ...prev,
      { displayName: '', email: '', institution: '', department: '', country: '', orcid: '', correspondingAuthor: false, authorOrder: prev.length + 1, isMe: false }
    ]);
  };

  const handleRemoveAuthor = (index) => {
    setAuthors(prev => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, authorOrder: i + 1 })));
  };

  const handleAuthorChange = (index, field, value) => {
    setAuthors(prev => {
      const updated = [...prev];
      if (field === 'correspondingAuthor' && value === true) {
        // Only one corresponding author allowed
        updated.forEach((a, i) => {
          a.correspondingAuthor = i === index;
        });
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  // HTML5 Drag & Drop Author Reordering
  const handleAuthorDragStart = (index) => {
    setDraggedAuthorIndex(index);
  };

  const handleAuthorDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleAuthorDrop = (index) => {
    if (draggedAuthorIndex === null || draggedAuthorIndex === index) return;
    setAuthors(prev => {
      const updated = [...prev];
      const draggedAuthor = updated[draggedAuthorIndex];
      updated.splice(draggedAuthorIndex, 1);
      updated.splice(index, 0, draggedAuthor);
      // Re-calculate orders
      return updated.map((auth, idx) => ({ ...auth, authorOrder: idx + 1 }));
    });
    setDraggedAuthorIndex(null);
  };

  // Manual sorting buttons (fallback/accessibility)
  const moveAuthor = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= authors.length) return;
    setAuthors(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((auth, idx) => ({ ...auth, authorOrder: idx + 1 }));
    });
  };

  // Keywords Tagging
  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordsInput.trim().replace(/,$/, '');
      if (val && !keywords.includes(val)) {
        setKeywords(prev => [...prev, val]);
        setKeywordsInput('');
      }
    }
  };

  const removeKeyword = (tag) => {
    setKeywords(prev => prev.filter(t => t !== tag));
  };

  // Research Areas autocomplete mock/API
  useEffect(() => {
    if (researchAreasInput.trim().length > 1) {
      // Mock suggestions based on input
      const areas = [
        'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 
        'Computer Vision', 'Natural Language Processing', 'Robotics', 
        'Bioinformatics', 'Data Science', 'Information Security', 'Quantum Computing'
      ];
      setSuggestedResearchAreas(
        areas.filter(a => a.toLowerCase().includes(researchAreasInput.toLowerCase()) && !selectedResearchAreas.includes(a))
      );
    } else {
      setSuggestedResearchAreas([]);
    }
  }, [researchAreasInput, selectedResearchAreas]);

  const addResearchArea = (area) => {
    if (!selectedResearchAreas.includes(area)) {
      setSelectedResearchAreas(prev => [...prev, area]);
    }
    setResearchAreasInput('');
    setSuggestedResearchAreas([]);
  };

  const removeResearchArea = (area) => {
    setSelectedResearchAreas(prev => prev.filter(a => a !== area));
  };

  // Dynamic Add New Format from Modal
  const handleCreateFormat = async (e) => {
    e.preventDefault();
    if (!newFormatData.name) return;
    try {
      const response = await api.post('/publications/types', newFormatData);
      const newType = response.data.data.type;
      setPublicationTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFormatForm(false);
      setNewFormatData({ name: '', category: 'published-research', description: '' });
      selectFormat(newType);
    } catch (err) {
      alert('Failed to create custom format: ' + (err.response?.data?.message || err.message));
    }
  };

  // Step Validations
  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === 3) {
      if (!formData.title || !formData.title.trim()) {
        errors.title = 'Publication Title is required.';
      }
      if (!formData.abstract || !formData.abstract.trim()) {
        errors.abstract = 'Abstract is required.';
      }
      
      // Validate specific fields
      if (selectedType) {
        selectedType.specificFields.forEach(f => {
          if (f.required && !specificFields[f.name]) {
            errors[f.name] = `${f.label} is required.`;
          }
        });
      }
    }
    
    if (currentStep === 4) {
      authors.forEach((auth, idx) => {
        if (!auth.displayName || !auth.displayName.trim()) {
          errors[`author_${idx}_name`] = 'Author Name is required.';
        }
        if (auth.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/i.test(auth.orcid)) {
          errors[`author_${idx}_orcid`] = 'Invalid ORCID format. (e.g. 0000-0002-1825-0097)';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  // Submit Draft or Publish
  const handleFinalSubmit = async (status) => {
    setSaving(true);
    setValidationErrors({});
    
    try {
      // 1. Create Publication
      const payload = {
        ...formData,
        publicationType: selectedType.slug,
        specificFields,
        authors,
        keywords,
        researchAreas: selectedResearchAreas,
        status, // 'draft' or 'published'
      };

      const response = await api.post('/publications', payload);
      const newPub = response.data.data.publication;
      
      // 2. Upload Cover Image if selected
      if (coverImageFile && newPub) {
        const coverPayload = new FormData();
        coverPayload.append('coverImage', coverImageFile);
        await api.post(`/publications/${newPub._id}/cover`, coverPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3. Upload Supplementary Files if selected
      if (files.length > 0 && newPub) {
        const filesPayload = new FormData();
        files.forEach(f => {
          filesPayload.append('files', f.file);
        });

        // Simulate progress intervals for smoother UI, though Axios handles progress
        await api.post(`/publications/${newPub._id}/files-multiple`, filesPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setFiles(prev => prev.map(f => ({ ...f, progress: percentCompleted })));
          }
        });
      }

      setCreatedPubId(newPub._id);
      setCreatedPubDoi(newPub.doi || 'Not Provided');
      setStep(7); // Show Success Page
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit publication';
      alert(errMsg);
      setValidationErrors({ submit: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const copyPublicationLink = () => {
    const link = `${window.location.origin}/publications/${createdPubId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format category name for displays
  const getCategoryTitle = (category) => {
    const map = {
      'published-research': 'Published Research',
      'preprint': 'Preprints / Drafts',
      'presentation': 'Presentations / Slides',
      'poster': 'Posters',
      'data': 'Research Data / Datasets',
      'methods-proposal-code': 'Methods / Proposals / Code'
    };
    return map[category] || category;
  };

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-semibold">Loading Publication Upload Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-left pb-20 px-4">
      {/* Back to publications */}
      {step < 7 && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              if (step === 1) navigate('/publications');
              else prevStep();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add Your Research</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 6: {
                step === 1 ? 'Select Category' :
                step === 2 ? 'Select Format' :
                step === 3 ? 'Fill Details' :
                step === 4 ? 'Manage Authors' :
                step === 5 ? 'Metadata & Tags' :
                'Review & Publish'
              }
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {step < 7 && (
        <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          ></div>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Published Research */}
            <div 
              onClick={() => handleCategorySelect('published-research')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Published Research</h3>
              <p className="text-xs text-slate-500 mt-2">Articles, Books, Conference Papers, Book Chapters, Patents, Technical Reports, or Theses.</p>
            </div>

            {/* Preprint */}
            <div 
              onClick={() => handleCategorySelect('preprint')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 mb-4 group-hover:bg-yellow-100 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Preprint</h3>
              <p className="text-xs text-slate-500 mt-2">Draft manuscript or paper shared before formal peer review and journal publication.</p>
            </div>

            {/* Presentation */}
            <div 
              onClick={() => handleCategorySelect('presentation')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-100 transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Presentation</h3>
              <p className="text-xs text-slate-500 mt-2">Conference slides, lecture presentations, or talk decks.</p>
            </div>

            {/* Poster */}
            <div 
              onClick={() => handleCategorySelect('poster')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 mb-4 group-hover:bg-pink-100 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Poster</h3>
              <p className="text-xs text-slate-500 mt-2">Conference poster summarizing research findings visually.</p>
            </div>

            {/* Data */}
            <div 
              onClick={() => handleCategorySelect('data')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:bg-green-100 transition-colors">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Data</h3>
              <p className="text-xs text-slate-500 mt-2">Datasets, tables, images, spreadsheets, genomic sequences, or raw instrument readings.</p>
            </div>

            {/* Methods / Proposal / Code */}
            <div 
              onClick={() => handleCategorySelect('methods-proposal-code')}
              className="group p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl bg-white cursor-pointer transition-all duration-200"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:bg-orange-100 transition-colors">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Methods / Proposal / Code</h3>
              <p className="text-xs text-slate-500 mt-2">Experimental protocols, software source code, grant proposals, or negative findings.</p>
            </div>
          </div>

          {/* Primary selector button */}
          <div className="pt-6 text-center border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedCategory('');
                setShowFormatModal(true);
              }}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5" /> Add More Research Formats
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SEARCHABLE FORMAT SELECTOR MODAL */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh] animate-scaleIn overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Research Format</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCategory ? `Filtered by ${getCategoryTitle(selectedCategory)}` : 'Browse all academic publication formats'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowFormatModal(false);
                  setSelectedCategory('');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-8 top-7" />
              <input
                type="text"
                placeholder="Search formats... (e.g. Patent, Code, Book)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {newFormatForm ? (
                // Add new format form (admin mock)
                <form onSubmit={handleCreateFormat} className="space-y-4 p-2 animate-fadeIn">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Create Custom Research Format</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Format Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Case Study"
                        value={newFormatData.name} 
                        onChange={e => setNewFormatData(prev => ({ ...prev, name: e.target.value }))}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Category</label>
                      <select 
                        value={newFormatData.category} 
                        onChange={e => setNewFormatData(prev => ({ ...prev, category: e.target.value }))}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                      >
                        <option value="published-research">Published Research</option>
                        <option value="preprint">Preprint</option>
                        <option value="presentation">Presentation</option>
                        <option value="poster">Poster</option>
                        <option value="data">Data</option>
                        <option value="methods-proposal-code">Methods / Proposal / Code</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Description</label>
                      <textarea 
                        rows={2}
                        placeholder="Describe this research format..."
                        value={newFormatData.description} 
                        onChange={e => setNewFormatData(prev => ({ ...prev, description: e.target.value }))}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setNewFormatForm(false)} 
                      className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl"
                    >
                      Back to list
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                    >
                      Save & Select
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {filteredTypes.length > 0 ? (
                    filteredTypes.map(t => (
                      <div
                        key={t.slug}
                        onClick={() => selectFormat(t)}
                        className="p-3 hover:bg-blue-50/60 hover:text-blue-700 rounded-xl cursor-pointer transition-all text-slate-700 flex flex-col"
                      >
                        <span className="text-sm font-semibold">{t.name}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t.description || 'No description available'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">No formats match your search.</div>
                  )}

                  {/* Add Custom Format Option */}
                  <div 
                    onClick={() => setNewFormatForm(true)}
                    className="p-3 border border-dashed border-slate-200 hover:border-blue-500 rounded-xl cursor-pointer text-center text-xs font-bold text-blue-600 hover:bg-blue-50/30 transition-all mt-3 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Format Definition
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DYNAMIC UPLOAD FORM (CORE DETAILS) */}
      {step === 3 && selectedType && (
        <div className="space-y-6 animate-fadeIn">
          {/* Format indicator header */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-100/50 px-2.5 py-1 rounded-md">Selected Format</span>
              <h3 className="text-base font-extrabold text-slate-800 mt-1">{selectedType.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{selectedType.description}</p>
            </div>
            <button 
              onClick={() => {
                setSelectedCategory('');
                setShowFormatModal(true);
              }}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Change Format
            </button>
          </div>

          {/* DOI lookup assistant */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700">Auto-fill details via DOI</h4>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 10.1016/j.jbi.2026.104230"
                value={doiQuery}
                onChange={(e) => setDoiQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleFetchDoi}
                disabled={fetchingDoi}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:bg-blue-400 cursor-pointer"
              >
                {fetchingDoi ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
              </button>
            </div>
            {doiError && <p className="text-xs text-red-500 font-medium">{doiError}</p>}
          </div>

          {/* Core Fields Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">1. Common Fields</h3>
              
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Publication Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Attention-Driven Spatial Reasoning in Healthcare Diagnostics"
                  className={`px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${validationErrors.title ? 'border-red-500' : 'border-slate-200'}`}
                />
                {validationErrors.title && <p className="text-[11px] text-red-500 font-semibold">{validationErrors.title}</p>}
              </div>

              {/* Subtitle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Subtitle (Optional)</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="e.g. A Transformer Approach to Diagnostic Segmentation"
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Abstract */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Abstract / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Provide a detailed summary of the research methodology, key findings, and academic contributions..."
                  className={`px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${validationErrors.abstract ? 'border-red-500' : 'border-slate-200'}`}
                />
                {validationErrors.abstract && <p className="text-[11px] text-red-500 font-semibold">{validationErrors.abstract}</p>}
              </div>

              {/* Date, DOI, Language */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Publication Date</label>
                  <input
                    type="date"
                    name="publicationDate"
                    value={formData.publicationDate}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">DOI Reference (Optional)</label>
                  <input
                    type="text"
                    name="doi"
                    value={formData.doi}
                    onChange={handleInputChange}
                    placeholder="e.g. 10.1016/j.jbi.2026.104230"
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Language</label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Country, Funding Info, Grant Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Country of Origin</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g. United States"
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Funding Agency / Sponsor</label>
                  <input
                    type="text"
                    name="fundingInfo"
                    value={formData.fundingInfo}
                    onChange={handleInputChange}
                    placeholder="e.g. National Science Foundation"
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Grant Number</label>
                  <input
                    type="text"
                    name="grantNumber"
                    value={formData.grantNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. NSF-10294-8B"
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* License, Version, Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">License</label>
                  <select
                    name="license"
                    value={formData.license}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    {licenses.map(lic => (
                      <option key={lic.code} value={lic.code}>{lic.code} - {lic.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Version</label>
                  <input
                    type="number"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    min={1}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Visibility</label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="public">Public (Open Access)</option>
                    <option value="restricted">Restricted (Members Only)</option>
                    <option value="private">Private (Only Me)</option>
                  </select>
                </div>
              </div>

              {/* Comments toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="commentsEnabled"
                  name="commentsEnabled"
                  checked={formData.commentsEnabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="commentsEnabled" className="text-xs font-bold text-slate-700 select-none">Enable peer comments and discussions on this research</label>
              </div>
            </div>

            {/* DYNAMIC SPECIFIC FIELDS (BASED ON SELECTED FORMAT) */}
            {selectedType.specificFields && selectedType.specificFields.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                  2. {selectedType.name}-Specific Fields
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedType.specificFields.map(field => {
                    const error = validationErrors[field.name];
                    return (
                      <div key={field.name} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={specificFields[field.name] || ''}
                            onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={`px-4 py-2 border rounded-xl text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={specificFields[field.name] || ''}
                            onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={`px-4 py-2 border rounded-xl text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
                          />
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={specificFields[field.name] || ''}
                            onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)}
                            className={`px-4 py-2 border rounded-xl text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
                          />
                        )}

                        {field.type === 'boolean' && (
                          <div className="flex items-center gap-2 py-2">
                            <input
                              type="checkbox"
                              id={field.name}
                              checked={!!specificFields[field.name]}
                              onChange={(e) => handleSpecificFieldChange(field.name, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={field.name} className="text-xs font-bold text-slate-600">{field.label}</label>
                          </div>
                        )}

                        {field.type === 'select' && (
                          <select
                            value={specificFields[field.name] || ''}
                            onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)}
                            className={`px-4 py-2 border rounded-xl text-sm bg-white ${error ? 'border-red-500' : 'border-slate-200'}`}
                          >
                            <option value="">-- Select Option --</option>
                            {field.options && field.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {error && <p className="text-[11px] text-red-500 font-semibold">{error}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COVER IMAGE & FILE UPLOADS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                3. Files & Media
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cover Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Cover Image</label>
                  <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 aspect-[4/3] relative overflow-hidden group">
                    {coverImagePreview ? (
                      <>
                        <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover absolute inset-0" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <label className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm">
                            Change Image
                            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <UploadIcon className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Upload Cover</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                        <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplementary Files Upload Zone */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Research Files & Datasets</label>
                  <div 
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[180px]"
                  >
                    <UploadIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Drag & drop files here, or click to browse</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, PPTX, ZIP, CSV, XLSX, JSON, Source Code up to 50MB</p>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-500">Selected Files ({files.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {files.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 border border-slate-200/60 bg-white rounded-xl text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{f.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {f.progress > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full" style={{ width: `${f.progress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{f.progress}%</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(f.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
            </div>

          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              Next Step: Authors <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AUTHOR MANAGEMENT */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Author Details</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Drag authors using the handle to reorder, or use the arrows.</p>
              </div>
              <button 
                type="button" 
                onClick={handleAddAuthor}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-blue-100/30"
              >
                <Plus className="w-4 h-4" /> Add Author
              </button>
            </div>

            <div className="space-y-3">
              {authors.map((author, index) => (
                <div 
                  key={index} 
                  draggable
                  onDragStart={() => handleAuthorDragStart(index)}
                  onDragOver={(e) => handleAuthorDragOver(e, index)}
                  onDrop={() => handleAuthorDrop(index)}
                  className={`border rounded-2xl p-4 transition-all duration-150 ${draggedAuthorIndex === index ? 'opacity-40 border-blue-400 bg-blue-50/10' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle & Order */}
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 p-1 hover:text-slate-600 hidden md:block">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col items-center justify-center w-6 h-6 bg-slate-50 text-slate-500 font-bold rounded-lg text-xs border border-slate-100">
                      {author.authorOrder}
                    </div>

                    {/* Main Row: Name, Email, ORCID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <input 
                          type="text" 
                          placeholder="Author Name *" 
                          value={author.displayName}
                          onChange={(e) => handleAuthorChange(index, 'displayName', e.target.value)}
                          className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-blue-500 ${validationErrors[`author_${index}_name`] ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {validationErrors[`author_${index}_name`] && <p className="text-[9px] text-red-500 font-semibold">{validationErrors[`author_${index}_name`]}</p>}
                      </div>
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={author.email}
                        onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex flex-col gap-1">
                        <input 
                          type="text" 
                          placeholder="ORCID (e.g. 0000-0002-1825-0097)" 
                          value={author.orcid}
                          onChange={(e) => handleAuthorChange(index, 'orcid', e.target.value)}
                          className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-blue-500 ${validationErrors[`author_${index}_orcid`] ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {validationErrors[`author_${index}_orcid`] && <p className="text-[9px] text-red-500 font-semibold">{validationErrors[`author_${index}_orcid`]}</p>}
                      </div>
                    </div>

                    {/* Sorting Buttons */}
                    <div className="flex flex-col gap-1">
                      <button 
                        type="button" 
                        disabled={index === 0} 
                        onClick={() => moveAuthor(index, 'up')}
                        className="p-1 border border-slate-100 hover:bg-slate-50 text-slate-400 disabled:opacity-30 rounded-lg cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        disabled={index === authors.length - 1} 
                        onClick={() => moveAuthor(index, 'down')}
                        className="p-1 border border-slate-100 hover:bg-slate-50 text-slate-400 disabled:opacity-30 rounded-lg cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    {!author.isMe && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAuthor(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Secondary Row: Affiliation, Department, Country */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 ml-0 md:ml-12">
                    <input 
                      type="text" 
                      placeholder="Institution Affiliation" 
                      value={author.institution}
                      onChange={(e) => handleAuthorChange(index, 'institution', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Department" 
                      value={author.department}
                      onChange={(e) => handleAuthorChange(index, 'department', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Country" 
                      value={author.country}
                      onChange={(e) => handleAuthorChange(index, 'country', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Toggle Options: Corresponding Author */}
                  <div className="flex items-center gap-4 mt-3 ml-0 md:ml-12 text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={author.correspondingAuthor}
                        onChange={(e) => handleAuthorChange(index, 'correspondingAuthor', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      Corresponding Author
                    </label>
                    {author.isMe && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px]">Me</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              Next Step: Metadata <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: RESEARCH METADATA */}
      {step === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            
            {/* Keywords Tagging */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Keywords / Subject Tags</label>
              <p className="text-[10px] text-slate-400">Type a keyword and press Enter or Comma.</p>
              <div className="border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-2 focus-within:border-blue-500 transition-all bg-white min-h-[80px]">
                {keywords.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-slate-200/50">
                    {tag}
                    <button type="button" onClick={() => removeKeyword(tag)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={keywords.length === 0 ? "e.g. machine learning, transformers, healthcare" : "Add keyword..."}
                  value={keywordsInput}
                  onChange={e => setKeywordsInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  className="flex-1 min-w-[150px] border-none outline-none focus:ring-0 text-sm py-1"
                />
              </div>
            </div>

            {/* Research Areas (Autocomplete) */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-bold text-slate-700">Research Areas</label>
              <p className="text-[10px] text-slate-400">Search and select the research areas this publication contributes to.</p>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Search research areas... (e.g. Computer Science, Genetics)"
                  value={researchAreasInput}
                  onChange={e => setResearchAreasInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Suggestions dropdown */}
              {suggestedResearchAreas.length > 0 && (
                <div className="absolute left-0 right-0 top-[84px] bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-2 space-y-0.5 max-h-[200px] overflow-y-auto">
                  {suggestedResearchAreas.map(area => (
                    <div
                      key={area}
                      onClick={() => addResearchArea(area)}
                      className="p-2.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer transition-all text-xs font-semibold text-slate-700"
                    >
                      {area}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Research Areas */}
              {selectedResearchAreas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedResearchAreas.map(area => (
                    <span key={area} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-100/40">
                      {area}
                      <button type="button" onClick={() => removeResearchArea(area)} className="text-blue-400 hover:text-blue-600 font-extrabold text-sm ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sustainable Development Goals (SDGs) */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-bold text-slate-700">UN Sustainable Development Goals (SDGs)</label>
              <p className="text-[10px] text-slate-400">If your research aligns with any UN SDGs, select them below.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto border border-slate-200 rounded-2xl p-4 bg-slate-50/20">
                {[
                  '1. No Poverty', '2. Zero Hunger', '3. Good Health & Well-being', 
                  '4. Quality Education', '5. Gender Equality', '6. Clean Water & Sanitation', 
                  '7. Affordable & Clean Energy', '8. Decent Work & Economic Growth', 
                  '9. Industry, Innovation & Infrastructure', '10. Reduced Inequalities', 
                  '11. Sustainable Cities & Communities', '12. Responsible Consumption', 
                  '13. Climate Action', '14. Life Below Water', '15. Life on Land', 
                  '16. Peace, Justice & Strong Institutions', '17. Partnerships for the Goals'
                ].map(sdg => {
                  const isSelected = keywords.includes(sdg);
                  return (
                    <div 
                      key={sdg}
                      onClick={() => {
                        if (isSelected) {
                          setKeywords(prev => prev.filter(k => k !== sdg));
                        } else {
                          setKeywords(prev => [...prev, sdg]);
                        }
                      }}
                      className={`p-2 border rounded-xl text-[11px] font-semibold text-left cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      {sdg}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              Next Step: Preview <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PREVIEW SCREEN */}
      {step === 6 && selectedType && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publication Preview</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Please review the details below before publishing your research.</p>
          </div>

          {/* Paper Layout Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            
            {/* Header info */}
            <div className="space-y-3 text-center md:text-left">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {selectedType.name}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                {formData.title}
              </h1>
              {formData.subtitle && (
                <p className="text-sm text-slate-500 font-semibold">{formData.subtitle}</p>
              )}
            </div>

            {/* Authors list */}
            <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1 text-xs font-bold text-slate-700 pb-4 border-b border-slate-100">
              {authors.map((auth, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {auth.displayName}
                  {auth.correspondingAuthor && <span className="text-blue-600 text-[10px]" title="Corresponding Author">✉</span>}
                  {idx < authors.length - 1 && <span className="text-slate-300">,</span>}
                </span>
              ))}
            </div>

            {/* Abstract Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abstract</h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">
                {formData.abstract}
              </p>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="space-y-3">
                {/* Common meta */}
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Publication Date</span>
                  <span className="text-slate-800 font-bold">{formData.publicationDate || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">DOI</span>
                  <span className="text-slate-800 font-bold">{formData.doi || 'None'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Language</span>
                  <span className="text-slate-800 font-bold">{formData.language}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">License</span>
                  <span className="text-blue-600 font-bold">{formData.license}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Specific fields */}
                {Object.entries(specificFields).map(([key, val]) => {
                  const fieldDef = selectedType.specificFields.find(f => f.name === key);
                  if (!fieldDef || val === undefined || val === '') return null;
                  return (
                    <div key={key} className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-semibold">{fieldDef.label}</span>
                      <span className="text-slate-800 font-bold">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Visibility</span>
                  <span className="text-slate-800 font-bold capitalize">{formData.visibility}</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map(tag => (
                    <span key={tag} className="bg-slate-50 border border-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Files ({files.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 p-2.5 border border-slate-100 bg-slate-50/50 rounded-xl text-xs">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-700 truncate">{f.name}</p>
                        <p className="text-[9px] text-slate-400">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back to Edit
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleFinalSubmit('draft')}
                disabled={saving}
                className="px-5 py-2.5 border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit('published')}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Publish Publication
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: PUBLISH SUCCESS */}
      {step === 7 && (
        <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-scaleIn">
          
          {/* Animated checkmark circle */}
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
            <Check className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Research Indexed Successfully!</h2>
            <p className="text-xs text-slate-500">Your publication is now live on ResearchConnect and visible to other researchers globally.</p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-left space-y-3 shadow-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-400 font-semibold">Publication ID</span>
              <span className="text-slate-800 font-bold font-mono select-all">{createdPubId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-semibold">Registered DOI</span>
              <span className="text-slate-800 font-bold font-mono">{createdPubDoi}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/publications/${createdPubId}`)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                View Publication
              </button>
              <button
                onClick={copyPublicationLink}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            
            <button
              onClick={() => {
                // Reset form states
                setFormData({
                  title: '',
                  subtitle: '',
                  abstract: '',
                  publicationDate: new Date().toISOString().split('T')[0],
                  publicationYear: new Date().getFullYear(),
                  language: 'English',
                  country: '',
                  doi: '',
                  fundingInfo: '',
                  grantNumber: '',
                  license: 'CC-BY-4.0',
                  version: 1,
                  visibility: 'public',
                  commentsEnabled: true,
                });
                setSpecificFields({});
                setAuthors([{ displayName: '', email: '', institution: '', department: '', country: '', orcid: '', correspondingAuthor: true, authorOrder: 1, isMe: true }]);
                setKeywords([]);
                setSelectedResearchAreas([]);
                setCoverImageFile(null);
                setCoverImagePreview('');
                setFiles([]);
                setStep(1);
              }}
              className="w-full py-3 border border-dashed border-blue-200 hover:border-blue-400 text-blue-600 bg-blue-50/10 hover:bg-blue-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              + Upload Another Publication
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPublication;
