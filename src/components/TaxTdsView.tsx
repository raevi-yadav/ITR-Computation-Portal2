import React from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, calculateTax, TaxResult } from '../utils/taxCalculator';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ChevronDown, ChevronUp, Database } from 'lucide-react';

interface PrepaidFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  entries: any[];
  isChallan?: boolean;
  liveCalculationString: string;
}

function PrepaidField({
  label,
  value,
  onChange,
  entries,
  isChallan = false,
  liveCalculationString
}: PrepaidFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const originalSum = entries.reduce((sum, item) => sum + (isChallan ? item.taxPaid : item.taxDeducted), 0);
  const isModified = value !== originalSum;
  const hasEntries = entries.length > 0;

  return (
    <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
        
        {hasEntries ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-55/60 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all cursor-pointer shrink-0"
          >
            <span>{isOpen ? 'Hide Details' : 'View Details'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
            No records found
          </span>
        )}
      </div>

      <div>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-10 px-3 text-sm font-normal text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 dark:bg-slate-950 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
        />
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Database className="w-3 h-3 shrink-0" />
          <span>{liveCalculationString}</span>
        </div>

        {isModified && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold animate-in fade-in slide-in-from-top-1 duration-250">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Modification detected: Total differs from JSON source</span>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasEntries && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-slate-200 dark:border-slate-805 rounded-xl overflow-hidden shadow-xs mt-3">
              <table className="w-full text-left border-collapse bg-white dark:bg-slate-950">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80">
                    {isChallan ? (
                      <>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">BSR Code</th>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Paid</th>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Challan No</th>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Tax Paid</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deductor Name</th>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TAN</th>
                        <th className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Tax Deducted</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      {isChallan ? (
                        <>
                          <td className="p-2 font-mono text-slate-700 dark:text-slate-300">{entry.bsrCode}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-400">{entry.datePaid}</td>
                          <td className="p-2 font-mono text-slate-700 dark:text-slate-300">{entry.challanNo}</td>
                          <td className="p-2 text-right font-semibold text-slate-900 dark:text-white">
                            {formatIndianCurrency(entry.taxPaid)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{entry.deductorName}</td>
                          <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{entry.tan}</td>
                          <td className="p-2 text-right font-semibold text-slate-900 dark:text-white">
                            {formatIndianCurrency(entry.taxDeducted)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-slate-50/30 dark:bg-slate-900/20 font-bold border-t border-slate-200 dark:border-slate-850">
                    <td colSpan={isChallan ? 3 : 2} className="p-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Parsed Source Total:
                    </td>
                    <td className="p-2 text-right text-indigo-600 dark:text-indigo-400">
                      {formatIndianCurrency(originalSum)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-850 dark:text-slate-200">
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
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-2xl p-5 space-y-4 border dark:border-slate-800">
            <h3 className="text-base font-semibold text-indigo-400 dark:text-indigo-300">
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
          {(() => {
            const tds1Count = (data.prepaid.tds1Entries || []).length;
            const firstEmployer = data.prepaid.tds1Entries?.[0]?.deductorName || 'Employer';
            const tds1Text = tds1Count > 0 
              ? `Found ${tds1Count} ${tds1Count === 1 ? 'entry' : 'entries'} from ${firstEmployer}`
              : 'No entries found';

            const tds2Count = (data.prepaid.tds2Entries || []).length;
            const tds2Text = `Aggregated from ${tds2Count} Form 16A certificate${tds2Count === 1 ? '' : 's'}`;

            const tcsCount = (data.prepaid.tcsEntries || []).length;
            const tcsText = `${tcsCount} transaction${tcsCount === 1 ? '' : 's'} verified against Form 27D`;

            const getLatestDate = (entries: any[]) => {
              if (!entries || entries.length === 0) return '';
              const sorted = [...entries].sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
              return sorted[0].datePaid;
            };
            const lastAdvanceDate = getLatestDate(data.prepaid.advanceTaxEntries || []);
            const advanceTaxText = lastAdvanceDate ? `Last challan date: ${lastAdvanceDate}` : 'No challans found';

            const saCount = (data.prepaid.selfAssessmentTaxEntries || []).length;
            const saText = `${saCount} challan${saCount === 1 ? '' : 's'} found in JSON summary`;

            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  Prepaid Tax & TDS Credits
                </h3>

                <div className="space-y-4">
                  <PrepaidField
                    label="TDS on Salary (Form 16)"
                    value={data.prepaid.tdsSalary}
                    onChange={(val) => updatePrepaid('tdsSalary', val)}
                    entries={data.prepaid.tds1Entries || []}
                    liveCalculationString={tds1Text}
                  />

                  <PrepaidField
                    label="TDS on Other Income (Form 16A)"
                    value={data.prepaid.tdsOthers}
                    onChange={(val) => updatePrepaid('tdsOthers', val)}
                    entries={data.prepaid.tds2Entries || []}
                    liveCalculationString={tds2Text}
                  />

                  <PrepaidField
                    label="TCS Paid (Form 27D)"
                    value={data.prepaid.tcsPaid}
                    onChange={(val) => updatePrepaid('tcsPaid', val)}
                    entries={data.prepaid.tcsEntries || []}
                    liveCalculationString={tcsText}
                  />

                  <PrepaidField
                    label="Advance Tax Paid"
                    value={data.prepaid.advanceTax}
                    onChange={(val) => updatePrepaid('advanceTax', val)}
                    entries={data.prepaid.advanceTaxEntries || []}
                    isChallan={true}
                    liveCalculationString={advanceTaxText}
                  />

                  <PrepaidField
                    label="Self-Assessment Tax Paid"
                    value={data.prepaid.selfAssessmentTax}
                    onChange={(val) => updatePrepaid('selfAssessmentTax', val)}
                    entries={data.prepaid.selfAssessmentTaxEntries || []}
                    isChallan={true}
                    liveCalculationString={saText}
                  />

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Total Prepaid Credits:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatIndianCurrency(taxResult.prepaidTax)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
