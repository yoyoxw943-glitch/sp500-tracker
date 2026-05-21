import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';
import ShareModal from './ShareModal';

const tabs = [
  { to: '/', label: 'Live', icon: '📈' },
  { to: '/history', label: 'History', icon: '📊' },
  { to: '/news', label: 'News', icon: '📰' },
  { to: '/calculator', label: 'Calc', icon: '🧮' },
  { to: '/learn', label: 'Learn', icon: '📚' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼' },
];

export default function Layout() {
  const { dark, toggle } = useTheme();
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#E0F2FE] dark:bg-[#0A1628]">
      {/* Desktop sidebar — md+ */}
      <div className="hidden md:flex md:flex-row md:min-h-screen">
        <nav className="w-60 glass flex flex-col p-5 shrink-0 m-3 rounded-2xl">
          <div className="mb-8">
            <h1 className="text-[2rem] font-extrabold tracking-tight">
              <span className="text-[#0EA5E9]">S&P</span>
              <span className="text-[#0F172A] dark:text-[#F8FAFC]"> Tracker</span>
            </h1>
            <p className="text-base text-slate-500 mt-1">Investment Education</p>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `touch-target flex items-center gap-3 px-4 py-3 rounded-xl nav-label transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0EA5E9]/15 text-[#0369A1] dark:text-[#60A5FA] border border-[#0EA5E9]/30 dark:border-[#2563EB]/30 shadow-sm'
                      : 'text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#0EA5E9]/8 dark:hover:bg-[#2563EB]/10'
                  }`
                }
              >
                <span className="text-[1.75rem]" aria-hidden>{tab.icon}</span>
                {tab.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#BAE6FD] dark:border-[#2563EB]/15">
            <button onClick={toggle} className="btn-ghost flex-1 text-base" aria-label="Toggle theme">
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowShare(true)} className="btn-ghost text-base flex items-center gap-1.5" aria-label="Share">
              📱 <span className="hidden lg:inline text-sm">Share</span>
            </button>
          </div>
        </nav>
        <main className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile layout — < md */}
      <div className="md:hidden flex flex-col min-h-screen pb-24">
        {/* Header gradient */}
        <header className="sticky top-0 z-20 header-gradient border-b border-[#BAE6FD] dark:border-[#2563EB]/15 px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-[1.625rem] font-extrabold tracking-tight">
            <span className="text-[#0EA5E9]">S&P</span>
            <span className="text-[#0F172A] dark:text-[#F8FAFC]"> Tracker</span>
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowShare(true)} className="touch-target px-2 text-xl flex items-center gap-1 font-semibold text-sm text-[#0369A1] dark:text-slate-400" aria-label="Share">
              📱 <span className="hidden xs:inline">Share</span>
            </button>
            <button onClick={toggle} className="touch-target px-2 text-xl" aria-label="Toggle theme">{dark ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#11112A] border-t border-[#BAE6FD] dark:border-[#2563EB]/15 flex justify-around py-1.5 safe-area-bottom">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-1 py-1 min-w-0 flex-1 touch-target transition-all duration-200 ${
                  isActive
                    ? 'text-[#0EA5E9] border-t-2 border-[#0EA5E9] dark:text-[#60A5FA] dark:border-[#60A5FA] -mt-1.5 pt-1.5'
                    : 'text-slate-400 dark:text-slate-500 border-t-2 border-transparent -mt-1.5 pt-1.5'
                }`
              }
            >
              <span className="text-[1.75rem]" aria-hidden>{tab.icon}</span>
              <span className="text-xs font-semibold truncate max-w-full mt-0.5">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </div>
  );
}
