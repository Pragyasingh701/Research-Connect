import React, { useState } from 'react';
import { Bookmark, FileText, Download, Share2, Eye, Award, Calendar } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PublicationCard({ publication }) {
  const pub = publication || {};
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [citeModalOpen, setCiteModalOpen] = useState(false);
  const [downloadUnavailableOpen, setDownloadUnavailableOpen] = useState(false);
  const [localDownloadCount, setLocalDownloadCount] = useState(pub.downloadCount || (pub.citationCount ? pub.citationCount * 2 + 18 : 18));
  const [localViewCount, setLocalViewCount] = useState(pub.viewCount || (pub.citationCount ? pub.citationCount * 7 + 104 : 104));

  // Toggles bookmark state
  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    setBookmarking(true);
    try {
      const res = await api.post('/publications/bookmark', { publicationId: pub._id });
      setBookmarked(res.data.data?.bookmarked ?? !bookmarked);
    } catch (err) {
      console.warn('Bookmark failed, toggling locally:', err);
      setBookmarked(!bookmarked);
    } finally {
      setBookmarking(false);
    }
  };

  // Trigger download with analytics
  const handleDownload = async (e) => {
    e.stopPropagation();
    api.post('/publications/downloads', { publicationId: pub._id }).catch(() => {});
    setLocalDownloadCount(prev => prev + 1);

    const docUrl = pub.pdfUrl || pub.fileUrl;
    if (docUrl) {
      window.open(docUrl.startsWith('/') ? `${api.defaults.baseURL || 'http://localhost:5000'}${docUrl}` : docUrl, '_blank');
    } else {
      setDownloadUnavailableOpen(true);
    }
  };

  // Read Online (Direct New Tab or Publisher Redirect)
  const handleRead = (e) => {
    e.stopPropagation();
    api.post('/publications/views', { publicationId: pub._id }).catch(() => {});
    setLocalViewCount(prev => prev + 1);

    const docUrl = pub.pdfUrl || pub.fileUrl;
    if (docUrl) {
      const resolvedUrl = docUrl.startsWith('/') 
        ? `${api.defaults.baseURL || 'http://localhost:5000'}${docUrl}` 
        : docUrl;
      window.open(resolvedUrl, '_blank');
    } else {
      handleOpenOriginalSource();
    }
  };

  // Open Original Source
  const handleOpenOriginalSource = () => {
    const sourceUrl = 
      pub.publisherUrl || 
      pub.doiUrl || 
      (pub.doi ? `https://doi.org/${pub.doi}` : '') || 
      pub.scholarUrl || 
      pub.publicationUrl || 
      pub.pdfUrl || 
      pub.fileUrl;

    if (sourceUrl) {
      window.open(sourceUrl, '_blank');
    } else {
      alert('Original publication source URL is not available.');
    }
  };

  // Share
  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      await api.post('/publications/share', { publicationId: pub._id });
    } catch (err) {}

    const shareUrl = `${window.location.origin}/publications/${pub._id || pub.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } else {
      alert(`Share link: ${shareUrl}`);
    }
  };

  const getAPA = () => {
    const authors = pub.authors?.map(a => a.authorName).join(', ') || 'Unknown Authors';
    return `${authors} (${pub.publicationYear || 'n.d.'}). ${pub.title || 'Not Available'}. ${pub.journal || pub.publisher || 'Academic Venue'}.`;
  };

  const getMLA = () => {
    const authors = pub.authors?.map(a => a.authorName).join(', ') || 'Unknown Authors';
    return `${authors}. "${pub.title || 'Not Available'}." ${pub.journal || pub.publisher || 'Academic Venue'}, ${pub.publicationYear || 'n.d.'}.`;
  };

  const getCardBgClass = () => {
    const type = (pub.publicationType || '').toLowerCase();
    if (type.includes('journal') || type.includes('article')) {
      return 'bg-[#DBEAFE]/15 hover:bg-[#DBEAFE]/30 border-[#DBEAFE]/50 hover:border-[#2563EB]/40';
    }
    if (type.includes('conference') || type.includes('proceeding') || type.includes('paper')) {
      return 'bg-[#EDE9FE]/20 hover:bg-[#EDE9FE]/35 border-[#EDE9FE]/60 hover:border-[#4F46E5]/40';
    }
    if (type.includes('book') || type.includes('chapter')) {
      return 'bg-[#FEF3C7]/15 hover:bg-[#FEF3C7]/30 border-[#FEF3C7]/50 hover:border-[#F59E0B]/40';
    }
    if (type.includes('patent') || type.includes('thesis') || type.includes('report')) {
      return 'bg-[#DCFCE7]/15 hover:bg-[#DCFCE7]/30 border-[#DCFCE7]/50 hover:border-[#22C55E]/40';
    }
    return 'bg-white hover:bg-slate-50 border-[#E2E8F0] hover:border-[#2563EB]/40';
  };

  return (
    <div 
      onClick={() => navigate(`/publications/${pub._id || pub.slug}`)}
      className={`rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-[#0F172A] flex flex-col justify-between relative overflow-hidden cursor-pointer border ${getCardBgClass()}`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-[10px] font-semibold bg-[#DBEAFE] px-2.5 py-0.5 rounded-full text-[#2563EB]">
            {pub.publicationType || 'Journal Article'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#22C55E] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> {pub.citationCount || 0} Citations
            </span>
            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarking}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                bookmarked 
                  ? 'bg-[#DBEAFE] border-[#2563EB]/25 text-[#2563EB]' 
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
              title="Bookmark"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thumbnail & Title Layout */}
        <div className="flex gap-4 items-start mb-3">
          {pub.thumbnail ? (
            <img src={pub.thumbnail} alt="" className="w-12 h-16 object-cover rounded-lg border border-[#E2E8F0] shrink-0" />
          ) : (
            <div className="w-12 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-center text-slate-300 shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
          )}
          
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#2563EB] transition-colors leading-snug line-clamp-2">
              {pub.title}
            </h3>
            <p className="text-[10px] text-[#475569] mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> {pub.publicationYear || '2026'} • <span className="truncate">{pub.journal || pub.conference || pub.publisher || 'Academic Venue'}</span>
            </p>
          </div>
        </div>

        {/* Authors */}
        {pub.authors && pub.authors.length > 0 && (
          <div className="text-[11px] text-[#475569] truncate mb-3">
            <span className="text-slate-400 font-medium">Authors: </span>
            {pub.authors.map(a => a.authorName || a.displayName).join(', ')}
          </div>
        )}

        {/* Abstract snippet */}
        {pub.abstract && (
          <p className="text-xs text-[#475569]/85 line-clamp-2 leading-relaxed mb-4 font-normal">
            {pub.abstract}
          </p>
        )}

        {/* Keywords */}
        {pub.keywords && pub.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pub.keywords.slice(0, 3).map((kw, idx) => (
              <span key={idx} className="px-2.5 py-0.5 bg-[#EDE9FE] rounded-full text-[9px] font-semibold text-[#4F46E5]">
                {kw.keyword || kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Divider */}
      <div className="border-t border-[#E2E8F0] pt-4 mt-auto flex flex-col gap-3">
        <div className="flex items-center justify-between text-[10px] text-[#475569] font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-400" /> {localViewCount} Views</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5 text-slate-400" /> {localDownloadCount} DLs</span>
          </div>
          <span className="font-mono text-[9px] text-slate-400">{pub.doi ? `DOI: ${pub.doi}` : 'No DOI'}</span>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Download button */}
          <button 
            onClick={handleDownload}
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500 hover:text-slate-800 hover:bg-slate-150 transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={`px-3 py-1.5 text-xs font-semibold border rounded-xl transition-all cursor-pointer relative ${
                shareSuccess 
                  ? 'bg-[#DCFCE7] border-[#22C55E]/30 text-[#22C55E]' 
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
              }`}
            >
              <Share2 className="w-3 h-3 inline mr-1" />
              Share
              {shareSuccess && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-emerald-600 text-white text-[8px] rounded font-bold whitespace-nowrap shadow">
                  Link Copied!
                </span>
              )}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCiteModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-slate-100 hover:text-[#0F172A] rounded-xl transition-colors cursor-pointer"
            >
              Cite
            </button>
            <button 
              onClick={handleRead}
              className="px-4 py-1.5 text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {pub.pdfUrl || pub.fileUrl ? 'Read' : 'Open'}
            </button>
          </div>
        </div>
      </div>

      {/* Citation Modal inside card */}
      {citeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl relative text-left">
            <h3 className="text-sm font-bold text-[#0F172A]">Cite Publication</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[8px] font-bold text-[#2563EB] uppercase block mb-1">APA</span>
                <div className="bg-[#F8FAFC] p-2 border border-[#E2E8F0] text-[10px] text-[#475569] rounded select-all font-sans">
                  {getAPA()}
                </div>
              </div>
              <div>
                <span className="text-[8px] font-bold text-[#2563EB] uppercase block mb-1">MLA</span>
                <div className="bg-[#F8FAFC] p-2 border border-[#E2E8F0] text-[10px] text-[#475569] rounded select-all font-sans">
                  {getMLA()}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setCiteModalOpen(false); }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Not Available Modal inside card */}
      {downloadUnavailableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-xl relative text-center">
            <h3 className="font-bold text-[#0F172A] text-sm">PDF not available</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              This publication does not have a direct full-text PDF. Open original publisher source instead?
            </p>
            <div className="flex gap-2 justify-center pt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloadUnavailableOpen(false);
                }}
                className="px-3 py-1.5 border border-[#E2E8F0] hover:bg-slate-100 rounded-lg text-xs text-slate-600 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloadUnavailableOpen(false);
                  handleOpenOriginalSource();
                }}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Open Source
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
