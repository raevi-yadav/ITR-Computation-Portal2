import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  FileCheck, 
  Download, 
  Printer, 
  Building, 
  User, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  Coins, 
  Calculator,
  Info
} from 'lucide-react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, TaxResult } from '../utils/taxCalculator';

interface DashboardViewProps {
  data: ITR4Data;
  taxResult: TaxResult;
  onUpload: (jsonText: string) => void;
  onLoadSample: () => void;
  onDownloadExcel: () => void;
  onPrintPdf: () => void;
  setTab: (tab: string) => void;
}

export default function DashboardView({
  data,
  taxResult,
  onUpload,
  onLoadSample,
  onDownloadExcel,
  onPrintPdf,
  setTab
}: DashboardViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onUpload(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            ITR-4 Computation Portal
          </h1>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Main Upload Area (Matches template style) */}
      <motion.div
        id="upload-dotted-box"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ borderColor: isDragging ? '#4f46e5' : 'rgb(226, 232, 240)' }}
        className={`p-6 bg-white dark:bg-slate-900 border-2 border-dashed rounded-[32px] border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all shadow-xs ${
          isDragging ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md uppercase tracking-wide">
              ITR-4
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upload ITR-4 JSON File
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-lg dark:shadow-none cursor-pointer"
          >
            Choose JSON
          </button>
          <button
            onClick={onLoadSample}
            className="px-5 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-bold text-sm rounded-2xl transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <FileCheck className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Load Sample
          </button>
        </div>
      </motion.div>

      {/* Grid of Key Metadata cards (Row 1) */}
      <div id="summary-grid-row-1" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Client Name - Takes 100% (2/2) on mobile, 50% (2/4) on desktop */}
      <div className="col-span-2 lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            CLIENT NAME
          </span>
          <User className="w-5 h-5 text-indigo-400 dark:text-indigo-500" />
        </div>
        <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 truncate">
          {data.personal.name || 'Upload'}
        </h3>
      </div>

      {/* PAN - Takes 50% (1/2) on mobile, 25% (1/4) on desktop */}
      <div className="col-span-1 lg:col-span-1 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            PAN CARD
          </span>
          <CreditCard className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wider">
          {data.personal.pan || '-'}
        </h3>
      </div>

      {/* Assessment Year - Takes 50% (1/2) on mobile, 25% (1/4) on desktop */}
      <div className="col-span-1 lg:col-span-1 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            ASSESSMENT YEAR
          </span>
          <Calendar className="w-5 h-5 text-orange-400 dark:text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">
          {data.personal.assessmentYear || '-'}
        </h3>
      </div>
    </div>

      {/* Grid of Key financial calculations (Row 2) */}
      <div id="summary-grid-row-2" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Total Income */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              GROSS TOTAL INCOME
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
            {formatIndianCurrency(taxResult.grossTotalIncome)}
          </h3>
        </div>

        {/* Total Income (Rounded) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              TOTAL TAXABLE INCOME
            </span>
            <Wallet className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            {formatIndianCurrency(taxResult.totalIncome)}
          </h3>
        </div>

        {/* Tax Payable(+)/Refundable(-) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              TAX PAYABLE(+)/REFUNDABLE(-)
            </span>
            <Coins className={`w-5 h-5 ${taxResult.payableAmount > 0 ? 'text-rose-500 dark:text-rose-400' : taxResult.refundAmount > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <h3 className={`text-2xl font-black ${taxResult.payableAmount > 0 ? 'text-rose-600 dark:text-rose-400' : taxResult.refundAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {taxResult.payableAmount > 0 
              ? `+${formatIndianCurrency(taxResult.payableAmount)}` 
              : taxResult.refundAmount > 0 
                ? `-${formatIndianCurrency(taxResult.refundAmount)}` 
                : '₹0'}
          </h3>
        </div>
      </div>

      {/* P&L + Balance Sheet Quick Action Box */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Financial Statement
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadExcel}
            className="px-4 py-2.5 bg-teal-600 text-white hover:bg-teal-500 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Computation Report */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Computation Report
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPrintPdf}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Download Computation
          </button>
        </div>
      </div>
    </div>
  );
}
