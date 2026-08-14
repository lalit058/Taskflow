import React from 'react';
import { Github, Linkedin, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/80 backdrop-blur-sm text-gray-600 text-sm py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">TaskFlow</span>
          <span className="text-gray-400">|</span>
          <span className="text-xs text-gray-500">v1.0.0</span>
        </div>

        {/* Center: Attribution (Stacked vertically using flex-col) */}
        <div className="text-xs text-gray-500 flex flex-col items-center sm:items-start gap-0.5">
          <p>
            Built by{' '}
            <span className="font-semibold text-gray-800">Lalit Bahadur Negi</span>
          </p>
          <span className="text-[11px] text-gray-400 font-medium">
            Full Stack MERN Developer
          </span>
        </div>

        {/* Right: Social / Repo Links */}
        <div className="flex items-center gap-4 text-gray-500">
          <a
            href="https://github.com/lalit058"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors p-1"
            title="GitHub Profile"
          >
            <Github size={18} />
          </a>
          <a
            href="https://www.linkedin.com/in/lalit-negi-73571b338/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors p-1"
            title="LinkedIn Profile"
          >
            <Linkedin size={18} />
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;