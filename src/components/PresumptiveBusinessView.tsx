import React from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency } from '../utils/taxCalculator';

interface PresumptiveBusinessViewProps {
  data: ITR4Data;
  onChange: (updated: ITR4Data) => void;
}

export default function PresumptiveBusinessView({
  data,
  onChange
}: PresumptiveBusinessViewProps) {
  
  const update44AD = (field: string, val: number) => {
    const updated = { ...data };
    updated.business44AD = { ...updated.business44AD, [field]: val };
    
    // Auto-compute presumptive minimums
    if (field === 'turnoverBank' || field === 'turnoverCash') {
      const bank = field === 'turnoverBank' ? val : updated.business44AD.turnoverBank;
      const cash = field === 'turnoverCash' ? val : updated.business44AD.turnoverCash;
      
      updated.business44AD.presumptiveIncomeBank = Math.round(bank * 0.06);
      updated.business44AD.presumptiveIncomeCash = Math.round(cash * 0.08);
      
      // If declared profit is 0 or less than min, auto-set to min sum
      const minSum = updated.business44AD.presumptiveIncomeBank + updated.business44AD.presumptiveIncomeCash;
      if (updated.business44AD.presumptiveIncomeTotal < minSum) {
        updated.business44AD.presumptiveIncomeTotal = minSum;
      }
    }
    onChange(updated);
  };

  const update44ADA = (field: string, val: number) => {
    const updated = { ...data };
    updated.profession44ADA = { ...updated.profession44ADA, [field]: val };
    
    if (field === 'grossReceipts') {
      updated.profession44ADA.presumptiveIncome = Math.round(val * 0.5);
    }
    onChange(updated);
  };

  const minCalculatedAD = Math.round(data.business44AD.turnoverBank * 0.06 + data.business44AD.turnoverCash * 0.08);

  return (
    <div id="presumptive-container" className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Presumptive Income (Sec 44AD / 44ADA)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Auto-computed from uploaded JSON. Ratios and financial statements recalculate in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: 44AD Presumptive Business */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SEC 44AD
            </span>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Business Turnover & Profit
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Bank / Digital Turnover
              </label>
              <input
                type="number"
                value={data.business44AD.turnoverBank || ''}
                onChange={(e) => update44AD('turnoverBank', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block pl-1 mt-1">
                Min 6% = {formatIndianCurrency(data.business44AD.presumptiveIncomeBank)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Cash Turnover
              </label>
              <input
                type="number"
                value={data.business44AD.turnoverCash || ''}
                onChange={(e) => update44AD('turnoverCash', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block pl-1 mt-1">
                Min 8% = {formatIndianCurrency(data.business44AD.presumptiveIncomeCash)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Min Presumptive Income (u/s 44AD):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatIndianCurrency(minCalculatedAD)}</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Declared Presumptive Business Profit
              </label>
              <input
                type="number"
                value={data.business44AD.presumptiveIncomeTotal || ''}
                onChange={(e) => update44AD('presumptiveIncomeTotal', Number(e.target.value))}
                className="w-full px-3 py-2.5 text-xs font-bold text-slate-950 dark:text-white bg-white dark:bg-slate-950 border-2 border-indigo-100 dark:border-indigo-950/50 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block pl-1 mt-1 leading-relaxed">
                Must be greater than or equal to minimum presumptive calculation of {formatIndianCurrency(minCalculatedAD)}.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: 44ADA Presumptive Profession */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SEC 44ADA
            </span>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Professional Receipts & Profit
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Gross Professional Receipts
              </label>
              <input
                type="number"
                value={data.profession44ADA.grossReceipts || ''}
                onChange={(e) => update44ADA('grossReceipts', Number(e.target.value))}
                placeholder="Doctor, Engineer, CA, Consultant, etc."
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block pl-1 mt-1">
                Min presumptive u/s 44ADA is 50% = {formatIndianCurrency(Math.round(data.profession44ADA.grossReceipts * 0.5))}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Declared Presumptive Professional Profit
              </label>
              <input
                type="number"
                value={data.profession44ADA.presumptiveIncome || ''}
                onChange={(e) => update44ADA('presumptiveIncome', Number(e.target.value))}
                className="w-full px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Financial Particulars of the Business (Schedule KP) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Financial Particulars of the Business (Schedule KP)
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 tracking-wider uppercase">
              These details are used to auto-generate the traditional Profit & Loss Account and Balance Sheet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Opening Stock */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Opening Stock</label>
              <input
                type="number"
                value={data.business44AD.openingStock || ''}
                onChange={(e) => update44AD('openingStock', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Purchases */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchases</label>
              <input
                type="number"
                value={data.business44AD.purchases || ''}
                onChange={(e) => update44AD('purchases', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Freight */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Freight / Direct Exp</label>
              <input
                type="number"
                value={data.business44AD.freight || ''}
                onChange={(e) => update44AD('freight', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Closing Stock */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Closing Stock</label>
              <input
                type="number"
                value={data.business44AD.closingStock || ''}
                onChange={(e) => update44AD('closingStock', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Cash in Hand */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cash in Hand</label>
              <input
                type="number"
                value={data.business44AD.cashInHand || ''}
                onChange={(e) => update44AD('cashInHand', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Total Assets */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Assets</label>
              <input
                type="number"
                value={data.business44AD.totalAssets || ''}
                onChange={(e) => update44AD('totalAssets', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
