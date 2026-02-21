import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 mt-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center gap-4 sm:gap-6 flex-wrap md:order-2">
          <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">About</a>
          <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">Privacy</a>
          <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">Terms</a>
          <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">Contact</a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} GPU Price Tracker. All rights reserved.
          </p>
          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500 max-w-lg mx-auto md:mx-0">
            Disclaimer: We may earn a commission if you sign up through links on this site. 
            Prices are retrieved via public APIs and scraping and may be delayed. 
            Always verify pricing on the provider's website.
          </p>
        </div>
      </div>
    </footer>
  );
};