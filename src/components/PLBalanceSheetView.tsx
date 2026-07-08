import React, { useState, useEffect } from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency } from '../utils/taxCalculator';
import { exportToExcel } from '../utils/excelExporter';
import { Edit2, AlertTriangle, Check, Info, Trash2, Plus, X, CheckCircle2 } from 'lucide-react';

interface PLBalanceSheetViewProps {
  data: ITR4Data;
  onDownloadExcel: () => void;
}

interface ExpenseItem {
  id: string;
  name: string;
  value: number;
}

export default function PLBalanceSheetView({ data }: PLBalanceSheetViewProps) {
  const p = data.personal;
  const b = data.business44AD;

  const getYearEnded = (ay: string) => {
    if (!ay) return '2026';
    const match = ay.match(/\d{4}/);
    return match ? match[0] : '2026';
  };
  const yearEnded = getYearEnded(p.assessmentYear);

  const grossTurnover = b.turnoverBank + b.turnoverCash;
  const netProfit = b.presumptiveIncomeTotal;

  // GP is calculated as the balancing figure of the Trading account
  const grossProfit = (grossTurnover + b.closingStock) - (b.openingStock + b.purchases + b.freight);
  const totalIndirectExpenses = grossProfit - netProfit;

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [editingExpenses, setEditingExpenses] = useState<ExpenseItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize honest baseline: Everything is 0, gap goes to Misc.
  // Also auto-corrects if turnover/profit changes from other tabs to maintain balance.
  useEffect(() => {
    setExpenses(prev => {
      if (prev.length === 0) {
        return [
          { id: 'salaryWages', name: 'Salary & Wages', value: 0 },
          { id: 'electricity', name: 'Electricity Exp', value: 0 },
          { id: 'conveyance', name: 'Conveyance & Travelling', value: 0 },
          { id: 'advertisement', name: 'Advertisement', value: 0 },
          { id: 'accountingCharges', name: 'Accounting Charges', value: 0 },
          { id: 'repairs', name: 'Repair & Maintenance', value: 0 },
          { id: 'bankCharges', name: 'Bank Charges', value: 0 },
          { id: 'legalFees', name: 'Legal & Accounting Fees', value: 0 },
          { id: 'printing', name: 'Printing & Stationery', value: 0 },
          { id: 'staffWelfare', name: 'Staff Welfare', value: 0 },
          { id: 'officeExps', name: 'Office Exps', value: 0 },
          { id: 'misc', name: 'Misc. Exp.', value: totalIndirectExpenses }
        ];
      }
      
      // If external data changed (like Gross Turnover), re-balance via Misc
      const currentSum = prev.reduce((a, item) => a + item.value, 0);
      if (currentSum !== totalIndirectExpenses) {
        const diff = totalIndirectExpenses - currentSum;
        return prev.map(e => e.id === 'misc' ? { ...e, value: e.value + diff } : e);
      }
      return prev;
    });
  }, [totalIndirectExpenses]);

  const handleStartEdit = () => {
    setEditingExpenses(JSON.parse(JSON.stringify(expenses)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    if (unallocated !== 0) return; // Hard lock
    setExpenses(editingExpenses);
    setIsEditing(false);
  };

  // Prevent alpha characters in number fields
  const blockInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Determine current working lists and balances
  const currentList = isEditing ? editingExpenses : expenses;
  const sumOfExpenses = currentList.reduce((acc, item) => acc + item.value, 0);
  const unallocated = totalIndirectExpenses - sumOfExpenses;
  const isBalanced = unallocated === 0;

  // Analyze if Misc Expenses is holding the "gap" (for warning banner)
  const miscExpObj = expenses.find(e => e.id === 'misc');
  const showUnallocatedWarning = !isEditing && (miscExpObj?.value || 0) > (totalIndirectExpenses * 0.1) && totalIndirectExpenses > 0;

  // Balance sheet math
  const capital = b.capital || Math.round(netProfit * 0.5);
  const securedLoans = b.securedLoans || 0;
  const unsecuredLoans = b.unsecuredLoans || 0;
  const creditors = b.sundryCreditors || Math.round(grossTurnover * 0.06);
  const otherLiabilities = b.otherLiabilities || Math.round(grossTurnover * 0.015);
  const totalLiabilities = capital + securedLoans + unsecuredLoans + creditors + otherLiabilities;

  const fixedAssets = b.fixedAssets || Math.round(totalLiabilities * 0.36);
  const debtors = b.sundryDebtors || Math.round(grossTurnover * 0.08);
  const closingStock = b.closingStock || 0;
  const cashInHand = b.cashInHand || 0;
  const advances = b.advances || 0;
  const bankBalance = b.bankBalance || Math.max(0, totalLiabilities - (fixedAssets + debtors + closingStock + cashInHand + advances));
  
  const totalAssets = fixedAssets + debtors + closingStock + cashInHand + bankBalance + advances;
  const difference = totalLiabilities - totalAssets;

  const handleLocalDownload = () => {
    exportToExcel(data, expenses, 0);
  };

  return (
    <div id="pl-bs-view-container" className="space-y-8 animate-in fade-in duration-350">
      
      {/* 1. HEADER SECTION */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Statements
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-2xl shadow-sm transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
              Modify Ledger
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
              
              {/* Save Button with Disabled Tooltip Wrapper */}
              <div className="relative group inline-block">
                <button
                  onClick={handleSaveChanges}
                  disabled={!isBalanced}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white rounded-2xl shadow-sm transition-all ${!isBalanced ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
                {!isBalanced && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl z-50 text-center leading-normal border border-slate-700 pointer-events-none">
                    Please balance the remaining <span className="font-bold text-amber-400">{formatIndianCurrency(unallocated)}</span> to exactly ₹0 before saving.
                  </div>
                )}
              </div>
            </>
          )}

          {!isEditing && (
            <button
              onClick={handleLocalDownload}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-sm transition-all shrink-0 cursor-pointer"
            >
              Export to Excel
            </button>
          )}
        </div>
      </div>

      {/* 2. TRADING & PROFIT & LOSS STATEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Transparent Auto-Gen Banner */}
        {showUnallocatedWarning && (
          <div className="px-6 py-3.5 bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">Pending Expense Distribution</p>
              <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
                <span className="font-bold">{formatIndianCurrency(miscExpObj?.value || 0)}</span> has been temporarily allocated to "Misc. Exp." to reconcile the JSON Net Profit. Click <strong>Modify Ledger</strong> to distribute this amount across relevant indirect expense heads.
              </p>
            </div>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-b border-slate-200 dark:border-slate-800 text-center space-y-1">
          {b.tradeName && (
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
              M/s. {b.tradeName}
            </h3>
          )}
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Trading and Profit & Loss Account for the Year Ended 31st March, {yearEnded}
          </h2>
          {b.businessCode && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Business Code: {b.businessCode}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse border-b border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Particulars</th>
                <th className={`px-5 py-3 border-r border-slate-200 dark:border-slate-800 ${isEditing ? 'w-64' : 'w-44 text-right'}`}>
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1.5">
                      Amount (₹)
                      <div className="relative group inline-flex items-center cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                        <div className="absolute top-full mt-2 right-0 hidden group-hover:block w-56 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] font-medium p-2.5 rounded-xl shadow-xl z-50 text-center leading-normal normal-case border border-slate-700">
                          The % tool distributes the exact gap between Gross Profit and JSON Net Profit.<br/>
                          <span className="font-bold text-amber-400 block mt-1">(100% = {formatIndianCurrency(totalIndirectExpenses)})</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    "Amount (₹)"
                  )}
                </th>
                <th className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Particulars</th>
                <th className="px-5 py-3 text-right w-44">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
              
              {/* Trading Account Rows */}
              <tr className="dark:border-slate-800">
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">To Opening Stock</td>
                <td className="px-5 py-2.5 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(b.openingStock)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">By Gross Turnover</td>
                <td className="px-5 py-2.5 text-right font-semibold">{formatIndianCurrency(grossTurnover)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">To Purchases</td>
                <td className="px-5 py-2.5 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(b.purchases)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">By Closing Stock</td>
                <td className="px-5 py-2.5 text-right font-semibold">{formatIndianCurrency(b.closingStock)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">To Freight & Carriage</td>
                <td className="px-5 py-2.5 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(b.freight)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-2.5 text-right"></td>
              </tr>
              <tr className="dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10">
                <td className="px-5 py-2.5 font-bold text-indigo-700 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">To Gross Profit c/d</td>
                <td className="px-5 py-2.5 text-right font-black text-indigo-700 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(grossProfit)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-2.5 text-right"></td>
              </tr>

              {/* Trading Total */}
              <tr className="bg-slate-100/60 dark:bg-slate-950/30 font-black border-y border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">Trading Total</td>
                <td className="px-5 py-2.5 text-right border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(b.openingStock + b.purchases + b.freight + grossProfit)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">Trading Total</td>
                <td className="px-5 py-2.5 text-right">{formatIndianCurrency(grossTurnover + b.closingStock)}</td>
              </tr>

              {/* Indirect Expenses / Profit and Loss Part */}
              {currentList.map((item, idx) => {
                const isFirstRow = idx === 0;
                return (
                  <tr key={item.id} className="dark:border-slate-800 group/row relative hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                    
                    {/* Particulars (Debit/Expenses) */}
                    <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 text-left relative">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingExpenses.filter((_, i) => i !== idx);
                            setEditingExpenses(updated);
                          }}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md cursor-pointer z-10"
                          title="Delete this expense row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div className={`flex items-center w-full font-medium text-slate-700 dark:text-slate-200 transition-all ${isEditing ? 'pl-6' : ''}`}>
                        <span className="select-none pr-1.5">To </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...editingExpenses];
                              updated[idx].name = e.target.value;
                              setEditingExpenses(updated);
                            }}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden text-slate-700 dark:text-slate-200 font-medium text-xs shadow-sm placeholder-slate-400"
                            placeholder="Expense Account Name"
                          />
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </div>
                    </td>

                    {/* Amount & % Tool (Rs.) */}
                    <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-3">
                          {/* The % Adjuster Tool */}
                          <div className="flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                            <input
                              type="number"
                              value={totalIndirectExpenses > 0 && item.value > 0 ? Number(((item.value / totalIndirectExpenses) * 100).toFixed(1)) : ''}
                              onChange={(e) => {
                                const pct = parseFloat(e.target.value);
                                const updated = [...editingExpenses];
                                updated[idx].value = isNaN(pct) ? 0 : Math.round(totalIndirectExpenses * (pct / 100));
                                setEditingExpenses(updated);
                              }}
                              className="w-10 bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-400 text-right focus:outline-hidden p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold pr-1">%</span>
                          </div>
                          
                          {/* The Absolute Amount Input */}
                          <input
                            type="number"
                            onKeyDown={blockInvalidNumberChars}
                            value={item.value === 0 ? '' : item.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const updated = [...editingExpenses];
                              updated[idx].value = isNaN(val) ? 0 : val;
                              setEditingExpenses(updated);
                            }}
                            className="w-24 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden font-bold text-slate-800 dark:text-slate-100 shadow-sm placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formatIndianCurrency(item.value)}
                        </span>
                      )}
                    </td>

                    {/* Credit Side Particulars */}
                    <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">
                      {isFirstRow ? (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">By Gross Profit b/d</span>
                      ) : null}
                    </td>

                    {/* Credit Side Amount */}
                    <td className="px-5 py-2.5 text-right">
                      {isFirstRow ? (
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          {formatIndianCurrency(grossProfit)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}

              {/* Add Custom Expense Row */}
              {isEditing && (
                <tr className="bg-slate-50/40 dark:bg-slate-950/20 dark:border-slate-800">
                  <td colSpan={2} className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpenses([
                          ...editingExpenses,
                          {
                            id: 'custom_' + Math.random().toString(36).substring(2, 9),
                            name: 'Custom Expense',
                            value: 0
                          }
                        ]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all cursor-pointer border border-dashed border-indigo-200 dark:border-indigo-800/50 w-max"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Expense
                    </button>
                  </td>
                  <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800"></td>
                  <td className="px-5 py-3 text-right"></td>
                </tr>
              )}

              {/* THE LIVE BALANCER (Only visible in Edit Mode) */}
              {isEditing && (
                <tr className={`border-y border-slate-200 dark:border-slate-800 ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {isBalanced ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> : <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
                    <span className={`font-black text-xs uppercase tracking-wider ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-500'}`}>
                      {isBalanced 
                        ? 'Expenses Perfectly Balanced' 
                        : unallocated < 0 
                          ? 'Deficit (Expenses Exceed Profit)' 
                          : 'Remaining Unallocated Balance'}
                    </span>
                  </td>
                  <td className={`px-5 py-4 text-right font-black text-sm border-r border-slate-200 dark:border-slate-800 ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-500'}`}>
                    {unallocated < 0 ? `-${formatIndianCurrency(Math.abs(unallocated))}` : formatIndianCurrency(unallocated)}
                  </td>
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800"></td>
                  <td className="px-5 py-4"></td>
                </tr>
              )}

              <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-bold">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800 text-indigo-950 dark:text-indigo-200">To Net Profit transferred to Capital A/c</td>
                <td className="px-5 py-3 text-right border-r border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-black">{formatIndianCurrency(netProfit)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-3 text-right"></td>
              </tr>

              {/* P&L Total */}
              <tr className="bg-slate-100/60 dark:bg-slate-950/30 font-black text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 text-sm">
                <td className="px-5 py-3.5 border-r border-slate-200 dark:border-slate-800">TOTAL</td>
                <td className="px-5 py-3.5 text-right border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(grossProfit)}</td>
                <td className="px-5 py-3.5 border-r border-slate-200 dark:border-slate-800">TOTAL</td>
                <td className="px-5 py-3.5 text-right">{formatIndianCurrency(grossProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. BALANCE SHEET STATEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-b border-slate-200 dark:border-slate-800 text-center space-y-1">
          {b.tradeName && (
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
              M/s. {b.tradeName}
            </h3>
          )}
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Balance Sheet as on 31st March, {yearEnded}
          </h2>
          {b.businessCode && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Business Code: {b.businessCode}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Liabilities</th>
                <th className="px-5 py-3 text-right border-r border-slate-200 dark:border-slate-800 w-44">Amount (₹)</th>
                <th className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Assets</th>
                <th className="px-5 py-3 text-right w-44">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Proprietor's Capital Account</td>
                <td className="px-5 py-3 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(capital)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Fixed Assets</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(fixedAssets)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Secured Loans</td>
                <td className="px-5 py-3 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(securedLoans)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Sundry Debtors</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(debtors)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Unsecured Loans</td>
                <td className="px-5 py-3 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(unsecuredLoans)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Closing Stock</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(closingStock)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Sundry Creditors</td>
                <td className="px-5 py-3 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(creditors)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Loans & Advances Given</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(advances)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Other Liabilities</td>
                <td className="px-5 py-3 text-right font-semibold border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(otherLiabilities)}</td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Cash in Hand</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(cashInHand)}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-3 text-right border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-3 border-r border-slate-200 dark:border-slate-800">Bank Balance</td>
                <td className="px-5 py-3 text-right font-semibold">{formatIndianCurrency(bankBalance)}</td>
              </tr>

              {/* Balance Sheet Total */}
              <tr className="bg-slate-100/60 dark:bg-slate-950/30 font-black text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 text-sm">
                <td className="px-5 py-3.5 border-r border-slate-200 dark:border-slate-800">TOTAL LIABILITIES</td>
                <td className="px-5 py-3.5 text-right border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(totalLiabilities)}</td>
                <td className="px-5 py-3.5 border-r border-slate-200 dark:border-slate-800">TOTAL ASSETS</td>
                <td className="px-5 py-3.5 text-right">{formatIndianCurrency(totalAssets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {difference !== 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 text-[11px] font-semibold text-red-500 dark:text-red-400 bg-red-50/25 dark:bg-red-950/10 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Note: Balance Sheet mismatch of {formatIndianCurrency(Math.abs(difference))}. Please reconcile ledger balances.</span>
          </div>
        )}
      </div>
    </div>
  );
}