import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  IndianRupee, 
  Percent, 
  FileSpreadsheet, 
  Calculator, 
  FileText,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  clientName: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  currentTab, 
  setTab, 
  clientName, 
  darkMode, 
  toggleDarkMode,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal & Bank', icon: User },
    { id: 'income', label: 'Income Details', icon: IndianRupee },
    { id: 'presumptive', label: '44AD / 44ADA / 44AE', icon: Percent },
    { id: 'pl-bs', label: 'P&L / Balance Sheet', icon: FileSpreadsheet },
    { id: 'tax', label: 'Tax & TDS', icon: Calculator },
    { id: 'pdf', label: 'Computation PDF', icon: FileText },
  ];

  const handleSelect = (id: string) => {
    setTab(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-indigo-700 text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">
            ₹
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white">TaxEase</h1>
            <p className="text-[9px] text-indigo-200">ITR-4 Computation</p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-indigo-700 text-white flex flex-col border-r border-indigo-800/40
        transform transition-all duration-300 ease-in-out lg:relative lg:transform-none
        ${sidebarOpen 
          ? 'translate-x-0 w-64 opacity-100' 
          : '-translate-x-full lg:-translate-x-full lg:w-0 lg:min-w-0 lg:opacity-0 lg:overflow-hidden'}
      `}>
        {/* Top Branding Section */}
        <div className="p-6 border-b border-indigo-800/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl text-white shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black tracking-tight text-white truncate">
                  TaxEase
                </h2>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider truncate">
                  ITR-4 Utility
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer hidden lg:flex items-center justify-center shrink-0"
              title="Close Sidebar"
            >
              <Menu className="w-5 h-5 text-white/80 hover:text-white" />
            </button>
          </div>
          <div className="mt-4 bg-indigo-800/50 rounded-2xl border border-white/10 p-3">
            <p className="text-[10px] text-indigo-100 leading-normal font-medium">
              Only ITR-4 JSON | Business & Presumptive
            </p>
          </div>
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <span className="px-3 text-[10px] font-bold tracking-widest text-indigo-200/60 uppercase block mb-3">
              MENU
            </span>
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const IconComp = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 group text-left
                      ${isActive 
                        ? 'bg-white/20 text-white font-semibold shadow-inner' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <IconComp className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Theme Toggle Section */}
          <div className="pt-4 border-t border-indigo-800/30">
            <span className="px-3 text-[10px] font-bold tracking-widest text-indigo-200/60 uppercase block mb-3">
              PREFERENCE
            </span>
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                )}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-emerald-400' : 'bg-slate-400/40'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Client display footer */}
        <div className="p-4 bg-indigo-800/50 border-t border-white/10 m-4 rounded-3xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <div className="min-w-0">
            <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider leading-none">
              CURRENT CLIENT
            </p>
            <p className="text-xs font-bold text-white truncate mt-1">
              {clientName || 'Not loaded'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}
    </>
  );
}
