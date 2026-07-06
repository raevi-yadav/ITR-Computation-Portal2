import React from 'react';
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
    onChange(updated);
  };

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
        {/* Table representation - identical layout to Screen 7 */}
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
              {/* Gross Salary */}
              <tr className="dark:border-slate-800">
                <td className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-200">Gross Salary</td>
                <td className="px-6 py-4.5 text-right">
                  <input
                    type="number"
                    value={data.salary.grossSalary || ''}
                    onChange={(e) => updateSalary('grossSalary', Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                  />
                </td>
              </tr>

              {/* Deduction u/s 16 */}
              <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 pl-10 font-medium">
                  Less: Standard Deduction u/s 16(ia)
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400">
                  -{formatIndianCurrency(taxResult.salaryIncome > 0 || data.salary.grossSalary > 0 ? (data.regime === 'NEW' ? 75000 : 50000) : 0)}
                </td>
              </tr>

              {/* Income from Salary */}
              <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-bold">
                <td className="px-6 py-4 text-indigo-900 dark:text-indigo-300">Income from Salary</td>
                <td className="px-6 py-4 text-right text-indigo-900 dark:text-indigo-300">
                  {formatIndianCurrency(taxResult.salaryIncome)}
                </td>
              </tr>

              {/* House Property Section */}
              <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Income from House Property</td>
                <td className="px-6 py-3 text-right"></td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 pl-10 font-medium">Gross Annual Rent Received</td>
                <td className="px-6 py-3 text-right">
                  <input
                    type="number"
                    value={data.houseProperty.grossRent || ''}
                    onChange={(e) => updateHouseProperty('grossRent', Number(e.target.value))}
                    placeholder="Gross Rent"
                    className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                  />
                </td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 pl-10 font-medium">Less: Municipal Taxes paid to Local Authority</td>
                <td className="px-6 py-3 text-right">
                  <input
                    type="number"
                    value={data.houseProperty.taxesPaid || ''}
                    onChange={(e) => updateHouseProperty('taxesPaid', Number(e.target.value))}
                    placeholder="Taxes Paid"
                    className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                  />
                </td>
              </tr>
              <tr className="bg-slate-50/20 dark:bg-slate-950/10 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <td className="px-6 py-2 pl-12">Annual Value</td>
                <td className="px-6 py-2 text-right">{formatIndianCurrency(Math.max(0, data.houseProperty.grossRent - data.houseProperty.taxesPaid))}</td>
              </tr>
              <tr className="bg-slate-50/20 dark:bg-slate-950/10 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <td className="px-6 py-2 pl-12">Less: 30% Standard Deduction u/s 24(a)</td>
                <td className="px-6 py-2 text-right">-{formatIndianCurrency(Math.max(0, data.houseProperty.grossRent - data.houseProperty.taxesPaid) * 0.3)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 pl-10 font-medium">Less: Interest payable on Borrowed Capital u/s 24(b)</td>
                <td className="px-6 py-3 text-right">
                  <input
                    type="number"
                    value={data.houseProperty.interestOnBorrowing || ''}
                    onChange={(e) => updateHouseProperty('interestOnBorrowing', Number(e.target.value))}
                    placeholder="Home Loan Interest"
                    className="w-32 px-3 py-1.5 text-right text-sm font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                  />
                </td>
              </tr>
              <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-bold">
                <td className="px-6 py-3 text-indigo-900 dark:text-indigo-300 pl-6">Net Income from House Property</td>
                <td className="px-6 py-3 text-right text-indigo-900 dark:text-indigo-300">
                  {formatIndianCurrency(taxResult.hpIncome)}
                </td>
              </tr>

              {/* Presumptive Business Income */}
              <tr className="font-semibold text-slate-700 dark:text-slate-200">
                <td className="px-6 py-4">Business / Profession Income (u/s 44AD/44ADA)</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatIndianCurrency(taxResult.businessIncome + taxResult.professionIncome)}
                </td>
              </tr>

              {/* Other Sources breakdown */}
              <tr className="dark:border-slate-800">
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Income from Other Sources</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">SAVINGS INT:</span>
                      <input
                        type="number"
                        value={data.otherSources.interestSavings || ''}
                        onChange={(e) => updateOtherSources('interestSavings', Number(e.target.value))}
                        className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">OTHER INT:</span>
                      <input
                        type="number"
                        value={data.otherSources.interestOthers || ''}
                        onChange={(e) => updateOtherSources('interestOthers', Number(e.target.value))}
                        className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">DIVIDEND INC:</span>
                      <input
                        type="number"
                        value={data.otherSources.dividendIncome || ''}
                        onChange={(e) => updateOtherSources('dividendIncome', Number(e.target.value))}
                        className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">OTHER INC:</span>
                      <input
                        type="number"
                        value={data.otherSources.otherIncome || ''}
                        onChange={(e) => updateOtherSources('otherIncome', Number(e.target.value))}
                        className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                      />
                    </div>
                  </div>
                </td>
              </tr>

              {/* Gross Total Income */}
              <tr className="bg-slate-100/50 dark:bg-slate-950/40 font-extrabold border-t border-slate-200 dark:border-slate-800">
                <td className="px-6 py-4 text-slate-900 dark:text-white">Gross Total Income (GTI)</td>
                <td className="px-6 py-4 text-right text-slate-900 dark:text-white text-base">
                  {formatIndianCurrency(taxResult.grossTotalIncome)}
                </td>
              </tr>

              {/* Deductions */}
              <tr className="dark:border-slate-800">
                <td className="px-6 py-4 text-slate-700 dark:text-slate-200 pl-6 font-semibold">
                  Chapter VI-A Deductions
                  {data.regime === 'NEW' && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-md ml-2">
                      NOT ALLOWED IN NEW REGIME
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {data.regime === 'OLD' ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">80C:</span>
                        <input
                          type="number"
                          value={data.deductions.sec80C || ''}
                          onChange={(e) => {
                            const updated = { ...data };
                            updated.deductions.sec80C = Number(e.target.value);
                            onChange(updated);
                          }}
                          className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">80D (Health):</span>
                        <input
                          type="number"
                          value={data.deductions.sec80D || ''}
                          onChange={(e) => {
                            const updated = { ...data };
                            updated.deductions.sec80D = Number(e.target.value);
                            onChange(updated);
                          }}
                          className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">80G (Donations):</span>
                        <input
                          type="number"
                          value={data.deductions.sec80G || ''}
                          onChange={(e) => {
                            const updated = { ...data };
                            updated.deductions.sec80G = Number(e.target.value);
                            onChange(updated);
                          }}
                          className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">80TTA (Savings):</span>
                        <input
                          type="number"
                          value={data.deductions.sec80TTA || ''}
                          onChange={(e) => {
                            const updated = { ...data };
                            updated.deductions.sec80TTA = Number(e.target.value);
                            onChange(updated);
                          }}
                          className="w-28 px-3 py-1 text-right text-xs font-semibold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 font-bold">₹0</span>
                  )}
                </td>
              </tr>

              {/* Net Taxable Income */}
              <tr className="bg-indigo-600 dark:bg-indigo-700 text-white font-extrabold text-base">
                <td className="px-6 py-5">Total Income (Rounded u/s 288A)</td>
                <td className="px-6 py-5 text-right">
                  {formatIndianCurrency(taxResult.totalIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informational Guidelines / Slabs display */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-[32px] p-6 space-y-4 shadow-md border dark:border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
              {data.regime === 'NEW' ? 'New Tax Slabs (FY 2025-26)' : 'Old Tax Slabs (FY 2025-26)'}
            </h3>

            <div className="space-y-2.5 text-xs">
              {data.regime === 'NEW' ? (
                <>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>Up to ₹3,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">NIL</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹3,00,001 - ₹7,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">5%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹7,00,001 - ₹10,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">10%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹10,00,001 - ₹12,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">15%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 dark:border-slate-900 pb-2">
                    <span>₹12,00,001 - ₹15,00,000</span>
                    <span className="font-bold text-indigo-400 dark:text-indigo-300">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Above ₹15,00,000</span>
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
                ? 'Under New Regime, full tax rebate is offered if total taxable income is up to ₹7,00,000. Marginal relief is provided for incomes slightly exceeding ₹7 Lakh.'
                : 'Under Old Regime, full tax rebate is offered if total taxable income is up to ₹5,00,000.'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
