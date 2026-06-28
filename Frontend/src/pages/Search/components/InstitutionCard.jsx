import React from 'react';
import { Building2, MapPin, Users, BookOpen, Quote } from 'lucide-react';

export default function InstitutionCard({ institution }) {
  const inst = institution || {};
  const stats = inst.stats || {};

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200 shadow-lg text-white flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex gap-3">
            <div className="w-11 h-11 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base hover:text-teal-400 cursor-pointer">
                {inst.name || 'Academic Institution'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {inst.country}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {inst.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {inst.description}
          </p>
        )}

        {/* Departments list */}
        {inst.departments && inst.departments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1.5">
              Departments
            </h4>
            <div className="flex flex-wrap gap-1">
              {inst.departments.slice(0, 3).map((dept, idx) => (
                <span 
                  key={idx} 
                  className="text-[10px] bg-slate-950 border border-slate-850/55 px-2 py-0.5 rounded text-slate-300"
                >
                  {dept}
                </span>
              ))}
              {inst.departments.length > 3 && (
                <span className="text-[10px] text-slate-500 font-medium px-1">
                  +{inst.departments.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats and Action */}
      <div className="border-t border-slate-850 pt-4 mt-auto">
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 bg-slate-950/20 py-2 rounded-xl">
          <div>
            <div className="font-bold text-slate-200">{stats.researchersCount || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase">Members</div>
          </div>
          <div>
            <div className="font-bold text-slate-200">{stats.publicationsCount || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase">Papers</div>
          </div>
          <div>
            <div className="font-bold text-slate-200">{stats.citationsCount || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase">Citations</div>
          </div>
        </div>

        <button className="w-full py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all">
          Explore Researchers
        </button>
      </div>
    </div>
  );
}
