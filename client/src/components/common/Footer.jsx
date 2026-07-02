import React from 'react';
import clsx from 'clsx';

export default function Footer() {
  return (
    <footer className={clsx(
      'w-full border-t border-slate-200/80 dark:border-slate-800',
      'bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto'
    )}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center gap-1.5">
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">IndiQuiz Live</span>
          <span>— All rights reserved.</span>
        </p>
        <div className="flex gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 font-medium"
          >
            GitHub
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Built with React, Vite, Tailwind CSS, Recharts, and Socket.IO.');
            }}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 font-medium"
          >
            About
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Mock Privacy Policy: All scores are cached in Redis and permanently stored in MongoDB.');
            }}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 font-medium"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}