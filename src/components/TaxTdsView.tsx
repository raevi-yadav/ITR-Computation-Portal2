import React, { useState, useEffect } from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, calculateTax, TaxResult } from '../utils/taxCalculator';
import { Edit2, Check, X, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaxTdsViewProps {
  data: ITR4Data;
  taxResult: TaxResult;
  onChange: (updated: ITR4Data) => void;
}

export default function TaxTdsView({ data, taxResult, onChange }: TaxTdsViewProps) {
  
  // Architectural Fix: True Local Draft State for Edit/Cancel mechanics
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ITR4Data>(data);
  const activeData = isEditing ? draft : data;
  
  // Live calculation for draft state
  const activeTaxResult = isEditing ? calculateTax(draft) : taxResult;

  // Accordion State
  const totalPrepaid = activeData.prepaid?.totalPrepaid || 0;
  const hasPrepaid = totalPrepaid > 0;
  const [expandedPrepaid, setExpandedPrepaid] = useState<boolean>(true); // Default open to show the flow

  useEffect(() => {
    if (!isEditing) setDraft(data);
  }, [data, isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setExpandedPrepaid(true); // Auto-expand when editing
  };
  
  const handleCancel = () => {
    setDraft(data);
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    onChange(draft);
    setIsEditing(false);
  };

  // Prevent alpha characters in number fields
  const blockInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const updateDraftPrepaid = (field: string, val: number) => {
    setDraft(prev => {
      const updatedPrepaid = { ...prev.prepaid, [field]: val };
      updatedPrepaid.totalTDS = updatedPrepaid.tdsSalary + updatedPrepaid.tdsOthers;
      updatedPrepaid.totalPrepaid = updatedPrepaid.totalTDS + 
                                     updatedPrepaid.tcsPaid + 
                                     updatedPrepaid.advanceTax + 
                                     updatedPrepaid.selfAssessmentTax;
      return { ...prev, prepaid: updatedPrepaid };
    });
  };

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handle Toast timeout safely
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showToast, toastMessage]);

  const handleRegimeChange = (regime: 'NEW' | 'OLD') => {
    const currentRegime = isEditing ? draft.regime : data.regime;
    if (currentRegime !== regime) {
      if (isEditing) {
        setDraft(prev => ({ ...prev, regime }));
      } else {
        onChange({ ...data, regime });
      }
      setToastMessage(`Tax regime switched to ${regime === 'NEW' ? 'New' : 'Old'} Regime. All computations updated.`);
      setShowToast(true);
    }
  };

  // Regime Comparison Data
  const altData: ITR4Data = { ...activeData, regime: activeData.regime === 'NEW' ? 'OLD' : 'NEW' };
  const altResult = calculateTax(altData);

  const activeRegimeName = activeData.regime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime';
  const alternativeRegimeName = activeData.regime === 'NEW' ? 'Old Tax Regime' : 'New Tax Regime';

  // Final Net Calculation
  const netTaxDifference = activeTaxResult.totalTaxLiability - totalPrepaid;
  const isPayable = netTaxDifference > 0;
  const finalAmount = Math.abs(netTaxDifference);

  // Render Helper for Compact Prepaid Table
  const renderPrepaidRow = (label: string, field: string, value: number) => (
    <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 px-6">
      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
      {isEditing ? (
        <input
          type="number"
          onKeyDown={blockInvalidNumberChars}
          value={value === 0 || !value ? '' : value}
          onChange={e => updateDraftPrepaid(field, Number(e.target.value))}
          placeholder="0"
          className="w-32 h-9 px-3 text-right text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatIndianCurrency(value || 0)}</span>
      )}
    </div>
  );

  return (
    <div id="tax-tds-container" className="space-y-6 animate-in fade-in duration-350">
      
      {/* HEADER SECTION */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Tax Computation
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-2xl shadow-sm transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
              Modify Details
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: THE WATERFALL COMPUTATION */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 1. Detailed Tax Computation Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800">
              Tax Computation Summary ({activeRegimeName})
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Total Taxable Income (u/s 288A)</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{formatIndianCurrency(activeTaxResult.totalIncome)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-2">
                <span>Tax on Total Income</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(activeTaxResult.taxBeforeRebate)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Less: Tax Rebate u/s 87A</span>
                <span>-{formatIndianCurrency(activeTaxResult.rebate87A)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Tax after Rebate u/s 87A</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(activeTaxResult.taxAfterRebate)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Add: Surcharge</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹0</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Add: Health & Education Cess @ 4%</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(activeTaxResult.cess)}</span>
              </div>

              <div className="flex justify-between items-center font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <span className="text-base">Gross Tax Liability</span>
                <span className="text-lg text-indigo-600 dark:text-indigo-400">{formatIndianCurrency(activeTaxResult.totalTaxLiability)}</span>
              </div>
            </div>
          </div>

          {/* 2. Compact Slabs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Slab-wise Breakup Details
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                    <th className="px-6 py-3">Slab Range</th>
                    <th className="px-6 py-3 text-center">Rate</th>
                    <th className="px-6 py-3 text-right">Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {activeTaxResult.slabs.map((slab, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {slab.min.toLocaleString('en-IN')} {slab.max === Infinity ? '+' : `to ${slab.max.toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50/30 dark:bg-slate-900/20">
                        {slab.rate}%
                      </td>
                      <td className={`px-6 py-3.5 text-right font-bold ${slab.tax > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        {formatIndianCurrency(slab.tax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Prepaid Taxes Accordion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedPrepaid(!expandedPrepaid)}
              className="w-full px-6 py-4 flex items-center justify-between cursor-pointer focus:outline-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
                  SCHEDULE IT & TDS
                </span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
                  Prepaid Taxes & TDS Credits
                </h3>
                {!expandedPrepaid && hasPrepaid && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {expandedPrepaid ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expandedPrepaid && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-slate-100 dark:border-slate-800/60">
                    <div className="py-2">
                      {renderPrepaidRow("TDS from Salary (Schedule TDS1)", "tdsSalary", activeData.prepaid?.tdsSalary || 0)}
                      {renderPrepaidRow("TDS on Other Income (Schedule TDS2)", "tdsOthers", activeData.prepaid?.tdsOthers || 0)}
                      {renderPrepaidRow("TCS (Schedule TCS)", "tcsPaid", activeData.prepaid?.tcsPaid || 0)}
                      {renderPrepaidRow("Advance Tax (Schedule IT)", "advanceTax", activeData.prepaid?.advanceTax || 0)}
                      {renderPrepaidRow("Self-Assessment Tax (Schedule IT)", "selfAssessmentTax", activeData.prepaid?.selfAssessmentTax || 0)}
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-950/30 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Total Prepaid Credits
                      </span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {formatIndianCurrency(totalPrepaid)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. GRAND FINALE: Net Payable / Refund */}
          <div className={`p-6 rounded-2xl border-2 flex items-center justify-between shadow-sm ${
            isPayable 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
          }`}>
            <div className="flex items-center gap-4">
              {isPayable ? (
                <ShieldAlert className="w-10 h-10 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
              )}
              <div>
                <h2 className={`text-sm font-extrabold uppercase tracking-widest ${isPayable ? 'text-amber-700 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
                  {isPayable ? 'Net Tax Payable' : 'Net Refund Due'}
                </h2>
                <p className={`text-xs font-semibold mt-1 ${isPayable ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                  Liability ({formatIndianCurrency(activeTaxResult.totalTaxLiability)}) - Prepaid ({formatIndianCurrency(totalPrepaid)})
                </p>
              </div>
            </div>
            <span className={`text-3xl font-black ${isPayable ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {formatIndianCurrency(finalAmount)}
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: REGIME COMMAND CENTER */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-2xl p-6 space-y-5 border border-slate-800 dark:border-slate-800/80 shadow-md sticky top-6">
            <h3 className="text-xs font-extrabold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
              Regime Command Center
            </h3>

            {/* Embedded Toggle */}
            <div className="space-y-2">
              <div className="flex bg-slate-800/50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-700/50 dark:border-slate-800/80 w-full">
                <button
                  onClick={() => handleRegimeChange('NEW')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeData.regime === 'NEW'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  New Regime
                </button>
                <button
                  onClick={() => handleRegimeChange('OLD')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeData.regime === 'OLD'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Old Regime
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 italic font-medium leading-normal text-center sm:text-left">
                Selection applies globally to all computation tabs and the final print report.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-4 bg-slate-800 dark:bg-slate-900/60 rounded-xl border border-indigo-500/30">
                <div>
                  <span className="font-bold text-white block">{activeRegimeName} <span className="text-indigo-400 font-semibold">(Selected)</span></span>
                  <span className="text-slate-400 font-medium">Total Tax liability</span>
                </div>
                <span className="text-base font-black text-white">{formatIndianCurrency(activeTaxResult.totalTaxLiability)}</span>
              </div>

              <div className="flex justify-between items-center px-4 py-2">
                <div>
                  <span className="font-semibold text-slate-400 block">{alternativeRegimeName}</span>
                </div>
                <span className="text-sm font-bold text-slate-400">{formatIndianCurrency(altResult.totalTaxLiability)}</span>
              </div>

              <div className="pt-2">
                {activeTaxResult.totalTaxLiability < altResult.totalTaxLiability ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium leading-relaxed">
                    Excellent! The selected {activeRegimeName} saves you <span className="font-bold text-white">{formatIndianCurrency(altResult.totalTaxLiability - activeTaxResult.totalTaxLiability)}</span>.
                  </div>
                ) : activeTaxResult.totalTaxLiability > altResult.totalTaxLiability ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium leading-relaxed">
                    Note: You could save <span className="font-bold text-white">{formatIndianCurrency(activeTaxResult.totalTaxLiability - altResult.totalTaxLiability)}</span> by switching to the {alternativeRegimeName}.
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/50 rounded-xl text-slate-400 text-center font-medium">
                    Tax liability is identical.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div 
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-950 text-white px-4.5 py-3.5 rounded-xl shadow-2xl border border-slate-800 dark:border-slate-800/80 transition-all duration-300 transform ${
          showToast 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-center bg-emerald-500/15 p-1 rounded-full text-emerald-500 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-100 leading-normal">
            {toastMessage}
          </p>
        </div>
        <button 
          onClick={() => setShowToast(false)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}