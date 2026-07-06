import React, { useState } from 'react';
import { ITR4Data, createBlankData } from './types';
import { SAMPLE_DATA, calculateTax } from './utils/taxCalculator';
import { parseITR4JSON } from './utils/jsonParser';
import { exportToExcel } from './utils/excelExporter';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PersonalBankView from './components/PersonalBankView';
import IncomeDetailsView from './components/IncomeDetailsView';
import PresumptiveBusinessView from './components/PresumptiveBusinessView';
import PLBalanceSheetView from './components/PLBalanceSheetView';
import TaxTdsView from './components/TaxTdsView';
import ComputationPdfView from './components/ComputationPdfView';
import NotificationModal from './components/NotificationModal';

const BLANK_DATA: ITR4Data = createBlankData();

export default function App() {
  const [data, setData] = useState<ITR4Data>(BLANK_DATA);
  const [tab, setTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Dark Mode State with local storage preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Temporarily strip dark mode class for clean printing
  React.useEffect(() => {
    const handleBeforePrint = () => {
      document.documentElement.classList.remove('dark');
    };
    const handleAfterPrint = () => {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [darkMode]);

  // Global Keyboard Shortcuts for professional workflow
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      );

      // 1. Ctrl+S or Cmd+S to export Excel
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadExcel();
        return;
      }

      // 2. Ctrl+P or Cmd+P to print / save PDF
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintPdf();
        return;
      }

      // Skip navigation and other non-modified keys if user is currently typing in an input
      if (isTyping) {
        return;
      }

      // 3. Alt + 1 to 7 for tab navigation
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const tabMap: Record<string, string> = {
          '1': 'dashboard',
          '2': 'personal',
          '3': 'income',
          '4': 'presumptive',
          '5': 'pl-bs',
          '6': 'tax',
          '7': 'pdf'
        };
        const targetTab = tabMap[e.key];
        if (targetTab) {
          setTab(targetTab);
        }
        return;
      }

      // 4. Alt + T to toggle theme (Dark / Light)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setDarkMode(prev => !prev);
        return;
      }

      // 5. Alt + K to toggle Sidebar
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, tab, darkMode]);

  // Modal alert states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  const taxResult = calculateTax(data);

  // Load sample dataset matching screenshots perfectly
  const handleLoadSample = () => {
    setData(JSON.parse(JSON.stringify(SAMPLE_DATA)));
    setModalTitle('Sample ITR-4 Data Loaded');
    setModalMessage('Sample ITR-4 data loaded. Now open P&L / Balance Sheet, Computation PDF, or Download Excel to understand the app.');
    setModalType('success');
    setModalOpen(true);
  };

  // Parse uploaded JSON dynamically
  const handleUpload = (jsonText: string) => {
    try {
      const parsed = parseITR4JSON(jsonText);
      setData(parsed);
      setModalTitle('ITR-4 JSON Loaded');
      setModalMessage(`Successfully imported ITR-4 details for ${parsed.personal.name || 'Client'}!\n\nAll financial ratios, Profit & Loss accounts, balance sheets, and tax liabilities have been recalculated.`);
      setModalType('success');
      setModalOpen(true);
    } catch (err: any) {
      setModalTitle('Upload Error');
      setModalMessage(err.message || 'Invalid ITR-4 JSON file. Please check file structure and try again.');
      setModalType('error');
      setModalOpen(true);
    }
  };

  // Save/Download traditional P&L and Balance Sheet spreadsheet
  const handleDownloadExcel = () => {
    if (!data.personal.name) {
      setModalTitle('No Data Loaded');
      setModalMessage('Please upload an ITR-4 JSON file or click "Load Sample" to generate the P&L and Balance Sheet Excel file.');
      setModalType('error');
      setModalOpen(true);
      return;
    }
    exportToExcel(data);
  };

  // Triggers print view on computation PDF
  const handlePrintPdf = () => {
    if (!data.personal.name) {
      setModalTitle('No Data Loaded');
      setModalMessage('Please upload an ITR-4 JSON file or click "Load Sample" to prepare the printable Computation PDF.');
      setModalType('error');
      setModalOpen(true);
      return;
    }
    setTab('pdf');
    // Allow brief render timeout before firing browser print dialog
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('Print failed:', err);
      }
    }, 400);
  };

  const renderActiveView = () => {
    switch (tab) {
      case 'dashboard':
        return (
          <DashboardView
            data={data}
            taxResult={taxResult}
            onUpload={handleUpload}
            onLoadSample={handleLoadSample}
            onDownloadExcel={handleDownloadExcel}
            onPrintPdf={handlePrintPdf}
            setTab={setTab}
          />
        );
      case 'personal':
        return <PersonalBankView data={data} onChange={setData} />;
      case 'income':
        return <IncomeDetailsView data={data} taxResult={taxResult} onChange={setData} />;
      case 'presumptive':
        return <PresumptiveBusinessView data={data} onChange={setData} />;
      case 'pl-bs':
        return <PLBalanceSheetView data={data} onDownloadExcel={handleDownloadExcel} />;
      case 'tax':
        return <TaxTdsView data={data} taxResult={taxResult} onChange={setData} />;
      case 'pdf':
        return <ComputationPdfView data={data} taxResult={taxResult} onPrint={handlePrintPdf} />;
      default:
        return null;
    }
  };

  return (
    <div id="app-root-layout" className="flex flex-col lg:flex-row min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar 
        currentTab={tab} 
        setTab={setTab} 
        clientName={data.personal.name} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Floating Sidebar Toggle when closed on Desktop */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 left-6 z-40 p-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-2xl shadow-md hover:shadow-indigo-900/40 hover:shadow-lg transition-all duration-200 cursor-pointer hidden lg:flex items-center justify-center border border-indigo-600/30"
          title="Open Sidebar"
        >
          <Menu className="w-5 h-5 animate-in fade-in zoom-in duration-200" />
        </button>
      )}

      {/* Main View Container */}
      <main id="main-content-scroll" className="flex-1 overflow-y-auto px-4 py-6 md:px-8 print:p-0">
        <div className="max-w-5xl mx-auto">
          {renderActiveView()}
        </div>
      </main>

      {/* Interactive Alert Confirmation Modal */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
}

