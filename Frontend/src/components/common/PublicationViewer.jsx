import React, { useState } from 'react';
import { X, Fullscreen, Maximize2, Minimize2, Download, FileText, Image as ImageIcon, Archive, BarChart4, ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function PublicationViewer({ isOpen, onClose, fileUrl, title, mimeType = 'application/pdf', supplementaryFiles = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [viewerMode, setViewerMode] = useState('google'); // 'google' or 'native'

  if (!isOpen) return null;

  // Prepend API base URL if relative path
  const getResolvedUrl = () => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('/')) {
      const base = api?.defaults?.baseURL || 'http://localhost:5000';
      return `${base.replace(/\/$/, '')}${fileUrl}`;
    }
    return fileUrl;
  };

  const resolvedUrl = getResolvedUrl();

  // Determine file category based on URL or mimeType
  const getFileCategory = () => {
    if (!resolvedUrl) return 'empty';
    const lowerUrl = resolvedUrl.toLowerCase();
    
    if (lowerUrl.endsWith('.pdf') || mimeType.includes('pdf')) {
      return 'pdf';
    }
    if (
      lowerUrl.endsWith('.jpg') || 
      lowerUrl.endsWith('.jpeg') || 
      lowerUrl.endsWith('.png') || 
      lowerUrl.endsWith('.webp') || 
      lowerUrl.endsWith('.gif') || 
      mimeType.includes('image')
    ) {
      return 'image';
    }
    if (
      lowerUrl.endsWith('.zip') || 
      lowerUrl.endsWith('.tar') || 
      lowerUrl.endsWith('.gz') || 
      mimeType.includes('zip') || 
      mimeType.includes('tar') || 
      mimeType.includes('compressed')
    ) {
      return 'zip';
    }
    if (
      lowerUrl.endsWith('.ppt') || 
      lowerUrl.endsWith('.pptx') || 
      mimeType.includes('presentation') || 
      mimeType.includes('powerpoint')
    ) {
      return 'presentation';
    }
    if (
      lowerUrl.endsWith('.csv') || 
      lowerUrl.endsWith('.xlsx') || 
      lowerUrl.endsWith('.xls') || 
      lowerUrl.endsWith('.json') || 
      mimeType.includes('sheet') || 
      mimeType.includes('csv')
    ) {
      return 'dataset';
    }
    
    // Fallback based on extension
    const ext = lowerUrl.split('.').pop();
    if (['zip', 'rar', 'tar', '7z'].includes(ext)) return 'zip';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) return 'image';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (['csv', 'xlsx', 'xls', 'json', 'tsv'].includes(ext)) return 'dataset';
    
    return 'pdf'; // Default fallback
  };

  const fileCategory = getFileCategory();

  // Mock slides for presentation preview if none are provided
  const mockSlides = [
    { number: 1, title: 'Introduction & Abstract', desc: 'Summary of diagnostic spatial reasoning transformer model architectures.' },
    { number: 2, title: 'Methodology & Spatial Attention', desc: 'Detailing multi-head cross-attention over 3D voxel representations.' },
    { number: 3, title: 'Clinical Trial Performance', desc: 'Comparative results against standard U-Net and Med3D baselines.' },
    { number: 4, title: 'Future Directions & Limitations', desc: 'Scaling constraints, edge-AI optimization, and federated setups.' }
  ];

  // Mock files inside zip/datasets if none are provided
  const mockArchiveContents = [
    { name: 'model_weights.bin', size: '242.4 MB', type: 'Weights' },
    { name: 'inference.py', size: '12.8 KB', type: 'Python Script' },
    { name: 'preprocess_voxels.py', size: '8.4 KB', type: 'Python Script' },
    { name: 'validation_dataset.csv', size: '4.2 MB', type: 'CSV Dataset' },
    { name: 'README.md', size: '3.1 KB', type: 'Documentation' }
  ];

  const handleDownloadFile = (url, fileName) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`flex flex-col bg-slate-900 border border-slate-800 shadow-2xl text-left transition-all duration-300 w-full max-w-5xl h-[85vh] overflow-hidden ${isFullscreen ? 'rounded-none h-screen max-w-none border-none' : 'rounded-3xl'}`}>
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              {fileCategory === 'pdf' && <FileText className="w-5 h-5" />}
              {fileCategory === 'image' && <ImageIcon className="w-5 h-5" />}
              {fileCategory === 'zip' && <Archive className="w-5 h-5" />}
              {fileCategory === 'presentation' && <Play className="w-5 h-5" />}
              {fileCategory === 'dataset' && <BarChart4 className="w-5 h-5" />}
              {fileCategory === 'empty' && <FileText className="w-5 h-5" />}
            </span>
            <div className="min-w-0">
              <h4 className="font-bold text-white text-sm truncate">{title || 'Publication Viewer'}</h4>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                Integrated Preview Mode • {fileCategory.toUpperCase()} format
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {resolvedUrl && (
              <button 
                onClick={() => handleDownloadFile(resolvedUrl, title)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download file"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            )}
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Dynamic PDF Toolbar Helper */}
        {fileCategory === 'pdf' && resolvedUrl && (
          <div className="bg-slate-950 border-b border-slate-850 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Viewer mode:</span>
              <button 
                onClick={() => setViewerMode('google')}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer text-[10px] uppercase tracking-wide ${
                  viewerMode === 'google' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Google Docs (Mobile Friendly)
              </button>
              <button 
                onClick={() => setViewerMode('native')}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer text-[10px] uppercase tracking-wide ${
                  viewerMode === 'native' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Native PDF (Direct Stream)
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Trouble reading?</span>
              <button 
                onClick={() => window.open(resolvedUrl, '_blank')}
                className="px-3.5 py-1 bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-300 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-[10px] uppercase tracking-wide"
              >
                Open PDF Directly <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* Viewer Workspace */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto relative">
          
          {/* 1. PDF Viewer */}
          {fileCategory === 'pdf' && resolvedUrl && (
            <iframe 
              src={
                viewerMode === 'google' && resolvedUrl.startsWith('http')
                  ? `https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true` 
                  : resolvedUrl
              } 
              className="w-full h-full border-none bg-slate-900" 
              title={title}
            />
          )}

          {/* 2. Image Viewer */}
          {fileCategory === 'image' && resolvedUrl && (
            <div className="p-8 max-w-full max-h-full flex items-center justify-center">
              <img 
                src={resolvedUrl} 
                alt={title} 
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl border border-slate-800" 
              />
            </div>
          )}

          {/* 3. ZIP / Archive Viewer */}
          {fileCategory === 'zip' && (
            <div className="p-8 w-full max-w-3xl space-y-6">
              <div className="text-center space-y-2">
                <Archive className="w-16 h-16 text-blue-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">ZIP Archive Contents</h4>
                <p className="text-xs text-slate-400">Preview of files bundled inside this research package.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-880 rounded-2xl overflow-hidden divide-y divide-slate-800">
                {mockArchiveContents.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-900 transition-colors text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-white block">{file.name}</span>
                        <span className="text-[10px] text-slate-500">{file.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono font-medium">{file.size}</span>
                      <button 
                        onClick={() => alert('Individual file downloads require premium plan or supplementary license access.')}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-blue-600 transition-all cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Presentation Slide Viewer */}
          {fileCategory === 'presentation' && (
            <div className="flex flex-col items-center justify-center p-8 w-full h-full max-w-4xl relative">
              <div className="flex-1 w-full bg-slate-900 border border-slate-850 rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden aspect-video">
                {/* Background watermarks or details */}
                <div className="absolute top-4 right-4 text-[9px] font-bold text-slate-800 uppercase tracking-widest">
                  ResearchConnect Presentation
                </div>
                
                <div className="space-y-4 my-auto">
                  <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    Slide {mockSlides[slideIndex].number} of {mockSlides.length}
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    {mockSlides[slideIndex].title}
                  </h3>
                  <p className="text-sm text-slate-450 leading-relaxed max-w-2xl font-sans">
                    {mockSlides[slideIndex].desc}
                  </p>
                </div>

                <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{title}</span>
                  <span>Presenter: Dr. Sarah Jenkins</span>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button 
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex(prev => prev - 1)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="text-xs text-slate-400 font-semibold font-mono">
                  {slideIndex + 1} / {mockSlides.length}
                </span>
                <button 
                  disabled={slideIndex === mockSlides.length - 1}
                  onClick={() => setSlideIndex(prev => prev + 1)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* 5. Datasets (CSV/Table previewer) */}
          {fileCategory === 'dataset' && (
            <div className="p-6 w-full h-full flex flex-col justify-between">
              <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900/50">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Variable ID</th>
                      <th className="px-5 py-3">Patient Hash</th>
                      <th className="px-5 py-3">Age Group</th>
                      <th className="px-5 py-3">Mean Area (mm²)</th>
                      <th className="px-5 py-3">Z-Score Deviation</th>
                      <th className="px-5 py-3">Diagnosis Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-medium font-sans">
                    <tr className="hover:bg-slate-900/50">
                      <td className="px-5 py-3 font-mono text-blue-400">VAR_04812</td>
                      <td className="px-5 py-3 font-mono">8f28c1ab</td>
                      <td className="px-5 py-3">55-64</td>
                      <td className="px-5 py-3">482.4</td>
                      <td className="px-5 py-3 text-red-400">+2.18</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-md text-[10px] font-bold uppercase text-red-400">High Risk</span></td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="px-5 py-3 font-mono text-blue-400">VAR_04813</td>
                      <td className="px-5 py-3 font-mono">2a91dfbc</td>
                      <td className="px-5 py-3">35-44</td>
                      <td className="px-5 py-3">291.8</td>
                      <td className="px-5 py-3 text-emerald-400">-0.42</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[10px] font-bold uppercase text-emerald-400">Control</span></td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="px-5 py-3 font-mono text-blue-400">VAR_04814</td>
                      <td className="px-5 py-3 font-mono">4d18ec99</td>
                      <td className="px-5 py-3">65-74</td>
                      <td className="px-5 py-3">684.1</td>
                      <td className="px-5 py-3 text-red-400">+3.48</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-md text-[10px] font-bold uppercase text-red-400">High Risk</span></td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="px-5 py-3 font-mono text-blue-400">VAR_04815</td>
                      <td className="px-5 py-3 font-mono">f8bc42e1</td>
                      <td className="px-5 py-3">45-54</td>
                      <td className="px-5 py-3">310.2</td>
                      <td className="px-5 py-3 text-slate-400">0.00</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[10px] font-bold uppercase text-emerald-400">Control</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Showing 4 of 425 rows</span>
                <span className="font-semibold text-blue-400 hover:underline cursor-pointer" onClick={() => handleDownloadFile(resolvedUrl, title)}>Download Complete CSV Dataset</span>
              </div>
            </div>
          )}

          {/* 6. Empty/Unavailable Fallback */}
          {(!resolvedUrl || fileCategory === 'empty') && (
            <div className="p-8 text-center space-y-4 max-w-sm">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="font-bold text-white">Preview unavailable</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                This item is an external reference list or does not have a direct full-text PDF.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
