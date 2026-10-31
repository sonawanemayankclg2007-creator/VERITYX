import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#090D16] py-6 text-xs text-slate-400 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Purpose */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px] flex-shrink-0">
              <div className="w-full h-full bg-[#090D16] rounded-[7px] flex items-center justify-center">
                <span className="text-purple-400 font-black text-[10px]">VX</span>
              </div>
            </div>
            <span className="font-bold text-white tracking-wide">VERITYX AI</span>
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-400">Intelligent Opportunity Intelligence & Verification Platform</span>
        </div>

        {/* Status Indicator & Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">All Systems Operational</span>
          </div>

          <Link
            to="/discover"
            className="text-slate-400 hover:text-white transition"
          >
            Discover
          </Link>
          <Link
            to="/eligibility-analyzer"
            className="text-slate-400 hover:text-white transition"
          >
            Eligibility
          </Link>
          <Link
            to="/deadline-guardian"
            className="text-slate-400 hover:text-white transition"
          >
            Deadlines
          </Link>
          <Link
            to="/settings"
            className="text-slate-400 hover:text-white transition"
          >
            Settings
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-slate-500 text-[11px] text-center md:text-right">
          © {new Date().getFullYear()} VERITYX AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
