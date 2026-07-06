import React from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, calculateTax, TaxResult } from '../utils/taxCalculator';

interface TaxTdsViewProps {
  data: ITR4Data;
  taxResult: TaxResult;
  onChange: (updated: ITR4Data) => void;
}

export default function TaxTdsView({ data, taxResult, onChange }: TaxTdsViewProps) {
  
  const updatePrepaid = (field: string, val: number) => {
    const updated = { ...data };
    updated.prepaid = { ...updated.prepaid, [field]: val };
    
    // Auto calculate totals
    updated.prepaid.totalTDS = updated.prepaid.tdsSalary + updated.prepaid.tdsOthers;
    updated.prepaid.totalPrepaid = updated.prepaid.totalTDS + 
                                   updated.prepaid.tcsPaid + 
                                   updated.prepaid.advanceTax + 
                                   updated.prepaid.selfAssessmentTax;
    onChange(updated);
  };

  // Get comparisons for the summary card
  const altData: ITR4Data = { ...data, regime: data.regime === 'NEW' ? 'OLD' : 'NEW' };
  const altResult = calculateTax(altData);

  const activeRegimeName = data.regime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime';
  const alternativeRegimeName = data.regime === 'NEW' ? 'Old Tax Regime' : 'New Tax Regime';

  return (
    <div id="tax-tds-container" className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Tax Calculations & Credits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Compare regimes, check slab-wise tax calculations, and manage TDS credits / tax payments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => onChange({ ...data, regime: 'NEW' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              data.regime === 'NEW'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/50'
            }`}
          >
            New Regime (FY 25-26)
          </button>
          <button
            onClick={() => onChange({ ...data, regime: 'OLD' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              data.regime === 'OLD'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-800/50'
            }`}
          >
            Old Regime (FY 25-26)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slabs calculation block */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Tax Calculation */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800">
              Tax Calculation Summary ({activeRegimeName})
            </h3>

            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Taxable Income (u/s 288A):</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.totalIncome)}</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Gross Tax on Slabs:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.taxBeforeRebate)}</span>
              </div>

              {taxResult.rebate87A > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Less: Tax Rebate u/s 87A:</span>
                  <span>-{formatIndianCurrency(taxResult.rebate87A)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tax After Rebate:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.taxAfterRebate)}</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Add: Health & Education Cess @ 4%:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.cess)}</span>
              </div>

              <div className="flex justify-between font-black text-slate-950 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-3 text-base">
                <span>Total Tax Liability:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatIndianCurrency(taxResult.totalTaxLiability)}</span>
              </div>
            </div>
          </div>

          {/* Slabs breakdown details */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Slab-wise Breakup details
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {taxResult.slabs.map((slab, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{slab.rate}% Slab</span>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">
                      {slab.min.toLocaleString('en-IN')} {slab.max === Infinity ? '+' : `to ${slab.max.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <span className={`font-black ${slab.tax > 0 ? 'text-indigo-600 dark:text-indigo-400 text-sm' : 'text-slate-400 dark:text-slate-600'}`}>
                    {formatIndianCurrency(slab.tax)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison & Prepaid Tax editing */}
        <div className="space-y-6">
          {/* Compare regime card */}
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-[32px] p-6 space-y-4 border dark:border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
              Regime Comparison Summary
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3.5 bg-slate-800/80 dark:bg-slate-900/60 rounded-2xl border border-slate-800 dark:border-slate-800">
                <div>
                  <span className="font-bold text-white block">{activeRegimeName} (Selected)</span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Total Tax liability</span>
                </div>
                <span className="text-base font-black text-white">{formatIndianCurrency(taxResult.totalTaxLiability)}</span>
              </div>

              <div className="flex justify-between items-center p-3.5 bg-slate-950/40 rounded-2xl">
                <div>
                  <span className="font-semibold text-slate-300 block">{alternativeRegimeName}</span>
                  <span className="text-slate-500 font-medium">Total Tax liability</span>
                </div>
                <span className="text-sm font-bold text-slate-300">{formatIndianCurrency(altResult.totalTaxLiability)}</span>
              </div>

              {taxResult.totalTaxLiability < altResult.totalTaxLiability ? (
                <div className="p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-2xl text-emerald-300 font-medium leading-relaxed">
                  Excellent! The selected {activeRegimeName} saves you <span className="font-bold text-white">{formatIndianCurrency(altResult.totalTaxLiability - taxResult.totalTaxLiability)}</span> in tax compared to {alternativeRegimeName}.
                </div>
              ) : taxResult.totalTaxLiability > altResult.totalTaxLiability ? (
                <div className="p-4 bg-amber-950/50 border border-amber-900/50 rounded-2xl text-amber-300 font-medium leading-relaxed">
                  Note: You could save <span className="font-bold text-white">{formatIndianCurrency(taxResult.totalTaxLiability - altResult.totalTaxLiability)}</span> by switching to the {alternativeRegimeName}.
                </div>
              ) : (
                <div className="p-4 bg-slate-800 rounded-2xl text-slate-400 text-center font-medium">
                  Tax liability is identical in both regimes.
                </div>
              )}
            </div>
          </div>

          {/* Prepaid Tax Inputs */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2.5 border-b border-slate-100 dark:border-slate-800">
              Prepaid Tax & TDS Credits
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  TDS on Salary (Form 16)
                </label>
                <input
                  type="number"
                  value={data.prepaid.tdsSalary || ''}
                  onChange={(e) => updatePrepaid('tdsSalary', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  TDS on Other Income (Form 16A)
                </label>
                <input
                  type="number"
                  value={data.prepaid.tdsOthers || ''}
                  onChange={(e) => updatePrepaid('tdsOthers', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  TCS Paid (Form 27D)
                </label>
                <input
                  type="number"
                  value={data.prepaid.tcsPaid || ''}
                  onChange={(e) => updatePrepaid('tcsPaid', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Advance Tax Paid
                </label>
                <input
                  type="number"
                  value={data.prepaid.advanceTax || ''}
                  onChange={(e) => updatePrepaid('advanceTax', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Self-Assessment Tax Paid
                </label>
                <input
                  type="number"
                  value={data.prepaid.selfAssessmentTax || ''}
                  onChange={(e) => updatePrepaid('selfAssessmentTax', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Total Prepaid Credits:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatIndianCurrency(taxResult.prepaidTax)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
