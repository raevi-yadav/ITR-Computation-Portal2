import React, { useState, useEffect } from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, TaxResult } from '../utils/taxCalculator';

interface IncomeDetailsViewProps {
  data: ITR4Data;
  taxResult: TaxResult;
  onChange: (updated: ITR4Data) => void;
}

export default function IncomeDetailsView({
  data,
  taxResult,
  onChange
}: IncomeDetailsViewProps) {
  // Compute totals for badge states and initial auto-expansion triggers
  const hpIncomeTotal = 
    (data.houseProperty.grossRent || 0) +
    (data.houseProperty.taxesPaid || 0) +
    (data.houseProperty.interestOnBorrowing || 0);

  const otherSourcesTotal = 
    (data.otherSources.interestSavings || 0) +
    (data.otherSources.interestOthers || 0) +
    (data.otherSources.dividendIncome || 0) +
    (data.otherSources.otherIncome || 0);

  const deductionsTotal = 
    (data.deductions.sec80C || 0) +
    (data.deductions.sec80D || 0) +
    (data.deductions.sec80G || 0) +
    (data.deductions.sec80TTA || 0);

  // Accordion Expansion States
  const [isHPExpanded, setIsHPExpanded] = useState(hpIncomeTotal > 0);
  const [isOtherSourcesExpanded, setIsOtherSourcesExpanded] = useState(otherSourcesTotal > 0);
  const [isDeductionsExpanded, setIsDeductionsExpanded] = useState(deductionsTotal > 0);

  // Auto-synchronize 80TTA value whenever Savings Bank Interest changes
  useEffect(() => {
    const calculated80TTA = Math.min(data.otherSources.interestSavings || 0, 10000);
    if (data.deductions.sec80TTA !== calculated80TTA) {
      onChange({
        ...data,
        deductions: {
          ...data.deductions,
          sec80TTA: calculated80TTA
        }
      });
    }
  }, [data.otherSources.interestSavings]);

  // Auto-expand sections if external updates introduce values
  useEffect(() => {
    if (hpIncomeTotal > 0) setIsHPExpanded(true);
  }, [hpIncomeTotal]);

  useEffect(() => {
    if (otherSourcesTotal > 0) setIsOtherSourcesExpanded(true);
  }, [otherSourcesTotal]);

  useEffect(() => {
    if (deductionsTotal > 0 && data.regime === 'OLD') setIsDeductionsExpanded(true);
  }, [deductionsTotal, data.regime]);

  const updateSalary = (field: string, val: number) => {
    const updated = { ...data };
    updated.salary = { ...updated.salary, [field]: val };
    onChange(updated);
  };

  const updateHouseProperty = (field: string, val: number) => {
    const updated = { ...data };
    updated.houseProperty = { ...updated.houseProperty, [field]: val };
    onChange(updated);
  };

  const updateOtherSources = (field: string, val: number) => {
    const updated = { ...data };
    updated.otherSources = { ...updated.otherSources, [field]: val };
    
    // Explicitly auto-calculate side-effect for 80TTA during live typings
    if (field === 'interestSavings') {
      updated.deductions = {
        ...updated.deductions,
        sec80TTA: Math.min(val, 10000)
      };
    }
    onChange(updated);
  };

  // Accessible keyboard toggle controller (Space / Enter keys)
  const handleAccordionKeyDown = (e: React.KeyboardEvent, toggleFn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFn();
    }
  };

  // Computed intermediate calculation values for House Property
  const computedAnnualValue = Math.max(0, (data.houseProperty.grossRent || 0) - (data.houseProperty.taxesPaid || 0));
  const computedStandardDeduction24a = computedAnnualValue * 0.3;

  return (
    <div id="income-details-container" className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Income Head-wise Summary
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Professional computation base figures. Modify any high-contrast fields to live-recalculate.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => onChange({ ...data, regime: 'NEW' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              data.regime === 'NEW'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/50'
            }`}
          >
            New Regime (FY 25-26)
          </button>
          <button
            onClick={() => onChange({ ...data, regime: 'OLD' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              data.regime === 'OLD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/50'
            }`}
          >
            Old Regime (FY 25-26)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  PARTICULARS
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              
              {/* --- SECTION: GROSS SALARY (SLATE/INDIGO TINT BLOCK) --- */}
              <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-l-4 border-slate-400 dark:border-slate-500">
                <td className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-200">Gross Salary</td>
                <td className="px-6 py-4.5 text-right">
                  <input
                    type="number"
                    placeholder="0"
                    value={data.salary.grossSalary || ''}
                    onChange={(e) => updateSalary('grossSalary', Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                  />
                </td>
              </tr>

              <tr className="bg-slate-50/30 dark:bg-slate-900/20 border-l-4 border-slate-400/40 dark:border-slate-500/30">
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 pl-10 font-medium">
                  Less: Standard Deduction u/s 16(ia)
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400">
                  -{formatIndianCurrency(taxResult.salaryIncome > 0 || data.salary.grossSalary > 0 ? (data.regime === 'NEW' ? 75000 : 50000) : 0)}
                </td>
              </tr>

              <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 border-l-4 border-indigo-500 dark:border-indigo-500/70 font-bold">
                <td className="px-6 py-4 text-indigo-900 dark:text-indigo-300 pl-6">Income from Salary</td>
                <td className="px-6 py-4 text-right text-indigo-900 dark:text-indigo-300">
                  {formatIndianCurrency(taxResult.salaryIncome)}
                </td>
              </tr>

              {/* --- SECTION: BUSINESS & PROFESSION (AMBER TINT BLOCK) --- */}
              <tr className="bg-amber-50/40 dark:bg-amber-950/10 border-l-4 border-amber-500 dark:border-amber-600 font-semibold text-slate-700 dark:text-slate-200">
                <td className="px-6 py-5">Business / Profession Income (u/s 44AD/44ADA)</td>
                <td className="px-6 py-5 text-right font-bold text-amber-800 dark:text-amber-400">
                  {formatIndianCurrency(taxResult.businessIncome + taxResult.professionIncome)}
                </td>
              </tr>

              {/* --- ACCORDION SECTION: INCOME FROM HOUSE PROPERTY (EMERALD TINT BLOCK) --- */}
              <tr 
                tabIndex={0}
                role="button"
                aria-expanded={isHPExpanded}
                aria-controls="house-property-subgrid"
                onClick={() => setIsHPExpanded(!isHPExpanded)}
                onKeyDown={(e) => handleAccordionKeyDown(e, () => setIsHPExpanded(!isHPExpanded))}
                className="cursor-pointer select-none bg-emerald-50/40 dark:bg-emerald-950/15 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/25 transition-colors focus:outline-none border-l-4 border-emerald-500 dark:border-emerald-600"
              >
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <svg 
                    className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ease-out ${isHPExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-emerald-950 dark:text-emerald-200">Income from House Property</span>
                  {!isHPExpanded && hpIncomeTotal > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-emerald-800 dark:text-emerald-400">
                  {formatIndianCurrency(taxResult.hpIncome)}
                </td>
              </tr>

              {/* Sub-fields inside House Property block */}
              {isHPExpanded && (
                <>
                  <tr id="house-property-subgrid" className="bg-emerald-50/15 dark:bg-emerald-950/5 border-l-4 border-emerald-500/40 dark:border-emerald-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-10 font-medium">Gross Annual Rent Received</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        value={data.houseProperty.grossRent || ''}
                        onChange={(e) => updateHouseProperty('grossRent', Number(e.target.value))}
                        placeholder="0"
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/15 dark:bg-emerald-950/5 border-l-4 border-emerald-500/40 dark:border-emerald-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-10 font-medium">Less: Municipal Taxes paid to Local Authority</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        value={data.houseProperty.taxesPaid || ''}
                        onChange={(e) => updateHouseProperty('taxesPaid', Number(e.target.value))}
                        placeholder="0"
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  
                  <tr className="bg-emerald-50/25 dark:bg-emerald-950/10 text-slate-500 dark:text-slate-400 text-sm font-medium border-l-4 border-emerald-500/40 dark:border-emerald-600/30">
                    <td className="px-6 py-2.5 pl-14 italic">Annual Value (Net)</td>
                    <td className="px-6 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">{formatIndianCurrency(computedAnnualValue)}</td>
                  </tr>
                  <tr className="bg-emerald-50/25 dark:bg-emerald-950/10 text-slate-500 dark:text-slate-400 text-sm font-medium border-l-4 border-emerald-500/40 dark:border-emerald-600/30">
                    <td className="px-6 py-2.5 pl-14 italic">Less: 30% Standard Deduction u/s 24(a)</td>
                    <td className="px-6 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">-{formatIndianCurrency(computedStandardDeduction24a)}</td>
                  </tr>

                  <tr className="bg-emerald-50/15 dark:bg-emerald-950/5 border-l-4 border-emerald-500/40 dark:border-emerald-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-10 font-medium">Less: Interest payable on Borrowed Capital u/s 24(b)</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        value={data.houseProperty.interestOnBorrowing || ''}
                        onChange={(e) => updateHouseProperty('interestOnBorrowing', Number(e.target.value))}
                        placeholder="0"
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                </>
              )}

              {/* --- ACCORDION SECTION: INCOME FROM OTHER SOURCES (SKY TINT BLOCK) --- */}
              <tr 
                tabIndex={0}
                role="button"
                aria-expanded={isOtherSourcesExpanded}
                aria-controls="other-sources-subgrid"
                onClick={() => setIsOtherSourcesExpanded(!isOtherSourcesExpanded)}
                onKeyDown={(e) => handleAccordionKeyDown(e, () => setIsOtherSourcesExpanded(!isOtherSourcesExpanded))}
                className="cursor-pointer select-none bg-sky-50/40 dark:bg-sky-950/15 hover:bg-sky-50/60 dark:hover:bg-sky-950/25 transition-colors focus:outline-none border-l-4 border-sky-500 dark:border-sky-600"
              >
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <svg 
                    className={`w-3.5 h-3.5 text-sky-600 dark:text-sky-400 transition-transform duration-200 ease-out ${isOtherSourcesExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-sky-950 dark:text-sky-200">Income from Other Sources</span>
                  {!isOtherSourcesExpanded && otherSourcesTotal > 0 && (
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-900/60">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-sky-700 dark:text-sky-400">
                  {formatIndianCurrency(taxResult.otherSourcesIncome)}
                </td>
              </tr>

              {/* Sub-fields inside Other Sources block */}
              {isOtherSourcesExpanded && (
                <>
                  <tr id="other-sources-subgrid" className="bg-sky-50/15 dark:bg-sky-950/5 border-l-4 border-sky-500/40 dark:border-sky-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Savings Bank Interest</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.otherSources.interestSavings || ''}
                        onChange={(e) => updateOtherSources('interestSavings', Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-sky-50/15 dark:bg-sky-950/5 border-l-4 border-sky-500/40 dark:border-sky-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Other Interest Income</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.otherSources.interestOthers || ''}
                        onChange={(e) => updateOtherSources('interestOthers', Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-sky-50/15 dark:bg-sky-950/5 border-l-4 border-sky-500/40 dark:border-sky-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Dividend Income</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.otherSources.dividendIncome || ''}
                        onChange={(e) => updateOtherSources('dividendIncome', Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-sky-50/15 dark:bg-sky-950/5 border-l-4 border-sky-500/40 dark:border-sky-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Any Other Incomes</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.otherSources.otherIncome || ''}
                        onChange={(e) => updateOtherSources('otherIncome', Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                </>
              )}

              {/* --- SECTION: GROSS TOTAL INCOME --- */}
              <tr className="bg-slate-100/60 dark:bg-slate-950/50 font-extrabold border-t-2 border-slate-200 dark:border-slate-800">
                <td className="px-6 py-4 text-slate-900 dark:text-white">Gross Total Income (GTI)</td>
                <td className="px-6 py-4 text-right text-slate-900 dark:text-white text-base">
                  {formatIndianCurrency(taxResult.grossTotalIncome)}
                </td>
              </tr>

              {/* --- ACCORDION SECTION: CHAPTER VI-A DEDUCTIONS (PURPLE TINT BLOCK) --- */}
              <tr 
                tabIndex={data.regime === 'OLD' ? 0 : undefined}
                role={data.regime === 'OLD' ? "button" : undefined}
                aria-expanded={data.regime === 'OLD' ? isDeductionsExpanded : undefined}
                aria-controls="deductions-subgrid"
                onClick={() => data.regime === 'OLD' && setIsDeductionsExpanded(!isDeductionsExpanded)}
                onKeyDown={(e) => data.regime === 'OLD' && handleAccordionKeyDown(e, () => setIsDeductionsExpanded(!isDeductionsExpanded))}
                className={`transition-colors border-l-4 ${
                  data.regime === 'OLD' 
                    ? 'cursor-pointer select-none bg-purple-50/40 dark:bg-purple-950/15 hover:bg-purple-50/60 dark:hover:bg-purple-950/25 focus:outline-none border-purple-500 dark:border-purple-600' 
                    : 'bg-slate-100/30 dark:bg-slate-950/20 border-slate-300 dark:border-slate-800 opacity-70'
                }`}
              >
                <td className="px-6 py-4 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2">
                  {data.regime === 'OLD' && (
                    <svg 
                      className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 transition-transform duration-200 ease-out ${isDeductionsExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className={data.regime === 'OLD' ? 'text-purple-950 dark:text-purple-200' : ''}>Chapter VI-A Deductions</span>
                  {data.regime === 'NEW' ? (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-md ml-2 border border-amber-200 dark:border-amber-900/30">
                      NOT ALLOWED IN NEW REGIME
                    </span>
                  ) : (
                    !isDeductionsExpanded && deductionsTotal > 0 && (
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-900/60">
                        Active
                      </span>
                    )
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">
                  {data.regime === 'OLD' 
                    ? `-${formatIndianCurrency(taxResult.grossTotalIncome - taxResult.totalIncome)}`
                    : '₹0'
                  }
                </td>
              </tr>

              {/* Sub-fields inside Deductions block */}
              {data.regime === 'OLD' && isDeductionsExpanded && (
                <>
                  <tr id="deductions-subgrid" className="bg-purple-50/15 dark:bg-purple-950/5 border-l-4 border-purple-500/40 dark:border-purple-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Section 80C (LIC, PPF, ELSS, etc.)</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.deductions.sec80C || ''}
                        onChange={(e) => {
                          const updated = { ...data };
                          updated.deductions.sec80C = Number(e.target.value);
                          onChange(updated);
                        }}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-purple-50/15 dark:bg-purple-950/5 border-l-4 border-purple-500/40 dark:border-purple-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Section 80D (Health Insurance Premium)</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.deductions.sec80D || ''}
                        onChange={(e) => {
                          const updated = { ...data };
                          updated.deductions.sec80D = Number(e.target.value);
                          onChange(updated);
                        }}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  <tr className="bg-purple-50/15 dark:bg-purple-950/5 border-l-4 border-purple-500/40 dark:border-purple-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium">Section 80G (Eligible Donations)</td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={data.deductions.sec80G || ''}
                        onChange={(e) => {
                          const updated = { ...data };
                          updated.deductions.sec80G = Number(e.target.value);
                          onChange(updated);
                        }}
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </td>
                  </tr>
                  
                  {/* --- COMPUTED & LOCKED FIELD: SECTION 80TTA --- */}
                  <tr className="bg-purple-50/15 dark:bg-purple-950/5 border-l-4 border-purple-500/40 dark:border-purple-600/30">
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-medium flex items-center">
                      <span>Section 80TTA (Savings Interest Claim)</span>
                      
                      {/* Interactive CSS Tooltip Element */}
                      <div className="relative group inline-flex items-center ml-2 cursor-help">
                        <svg 
                          className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] font-medium p-2.5 rounded-xl shadow-xl z-50 text-center leading-normal normal-case border border-slate-700 dark:border-slate-600">
                          Automated deduction capped at ₹10,000, computed directly from your Savings Bank Interest field above.
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        value={data.deductions.sec80TTA || 0}
                        readOnly
                        disabled
                        className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 rounded-xl cursor-not-allowed focus:outline-hidden select-none"
                      />
                    </td>
                  </tr>
                </>
              )}

              {/* --- SECTION: TOTAL TAXABLE INCOME --- */}
              <tr className="bg-indigo-600 dark:bg-indigo-700 text-white font-extrabold text-base">
                <td className="px-6 py-5 border-l-4 border-indigo-700 dark:border-indigo-800">Total Income (Rounded u/s 288A)</td>
                <td className="px-6 py-5 text-right">
                  {formatIndianCurrency(taxResult.totalIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informational Guidelines / Slabs display */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-[32px] p-6 space-y-4 shadow-md border border-slate-800 dark:border-slate-900">
            <h3 className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
              {data.regime === 'NEW' ? 'New Tax Slabs (FY 2025-26)' : 'Old Tax Slabs (FY 2025-26)'}
            </h3>

            <div className="space-y-2.5 text-xs">
              {data.regime === 'NEW' ? (
                <>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>Up to ₹4,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">NIL</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹4,00,001 - ₹8,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">5%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹8,00,001 - ₹12,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">10%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹12,00,001 - ₹16,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">15%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹16,00,001 - ₹20,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">20%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹20,00,001 - ₹24,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Above ₹24,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">30%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>Up to ₹2,50,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">NIL</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹2,50,001 - ₹5,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">5%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹5,00,001 - ₹10,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Above ₹10,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">30%</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-800/80 dark:bg-slate-900/60 p-4 rounded-2xl text-xs leading-relaxed text-slate-300 border border-slate-800 dark:border-slate-900">
              <span className="font-bold text-amber-400 dark:text-amber-300 block mb-1">Section 87A Rebate:</span>
              {data.regime === 'NEW' 
                ? 'Under New Regime, full tax rebate is offered if total taxable income is up to ₹12,00,000. Marginal relief is provided for incomes slightly exceeding ₹12 Lakh.'
                : 'Under Old Regime, full tax rebate is offered if total taxable income is up to ₹5,00,000.'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}