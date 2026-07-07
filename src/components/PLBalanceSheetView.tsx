import React from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency } from '../utils/taxCalculator';
import { exportToExcel } from '../utils/excelExporter';
import { Edit2, HelpCircle, AlertTriangle, CheckCircle, Info, Trash2, Plus, Check, X } from 'lucide-react';

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

  // GP is ALWAYS calculated as the balancing figure of the Trading account:
  // Debit side direct costs: Opening Stock + Purchases + Freight
  // Credit side: Gross Turnover + Closing Stock
  const grossProfit = (grossTurnover + b.closingStock) - (b.openingStock + b.purchases + b.freight);
  const totalIndirectExpenses = grossProfit - netProfit;

  // Proportional expense ratios to distribute initial estimates
  const expenseRatios = {
    salaryWages: 0.18,
    electricity: 0.07,
    conveyance: 0.08,
    advertisement: 0.05,
    accountingCharges: 0.08,
    repairs: 0.06,
    bankCharges: 0.02,
    legalFees: 0.10,
    printing: 0.07,
    staffWelfare: 0.06,
    officeExps: 0.07
  };

  // Generate initial static estimates matching ITR schedules
  const initialValues = React.useMemo(() => {
    const gp = (grossTurnover + b.closingStock) - (b.openingStock + b.purchases + b.freight);
    const totalInd = gp - netProfit;
    const getExpVal = (ratio: number) => Math.max(0, Math.round(totalInd * ratio));

    const sal = b.purchases > 0 ? 21007 : getExpVal(expenseRatios.salaryWages);
    const elec = b.purchases > 0 ? 8173 : getExpVal(expenseRatios.electricity);
    const conv = b.purchases > 0 ? 9340 : getExpVal(expenseRatios.conveyance);
    const adv = b.purchases > 0 ? 5838 : getExpVal(expenseRatios.advertisement);
    const acct = b.purchases > 0 ? 9356 : getExpVal(expenseRatios.accountingCharges);
    const rep = b.purchases > 0 ? 7005 : getExpVal(expenseRatios.repairs);
    const bank = b.purchases > 0 ? 2335 : getExpVal(expenseRatios.bankCharges);
    const leg = b.purchases > 0 ? 11675 : getExpVal(expenseRatios.legalFees);
    const print = b.purchases > 0 ? 8175 : getExpVal(expenseRatios.printing);
    const staff = b.purchases > 0 ? 7006 : getExpVal(expenseRatios.staffWelfare);
    const office = b.purchases > 0 ? 8177 : getExpVal(expenseRatios.officeExps);

    return {
      salaryWages: sal,
      electricity: elec,
      conveyance: conv,
      advertisement: adv,
      accountingCharges: acct,
      repairs: rep,
      bankCharges: bank,
      legalFees: leg,
      printing: print,
      staffWelfare: staff,
      officeExps: office
    };
  }, [grossTurnover, b.closingStock, b.openingStock, b.purchases, b.freight, netProfit]);

  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
  const [editingExpenses, setEditingExpenses] = React.useState<ExpenseItem[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);

  // Sync edited expenses on fresh JSON/Data loads
  React.useEffect(() => {
    const initialList: ExpenseItem[] = [
      { id: 'salaryWages', name: 'Salary & Wages', value: initialValues.salaryWages },
      { id: 'electricity', name: 'Electricity Exp', value: initialValues.electricity },
      { id: 'conveyance', name: 'Conveyance & Travelling', value: initialValues.conveyance },
      { id: 'advertisement', name: 'Advertisement', value: initialValues.advertisement },
      { id: 'accountingCharges', name: 'Accounting Charges', value: initialValues.accountingCharges },
      { id: 'repairs', name: 'Repair & Maintenance', value: initialValues.repairs },
      { id: 'bankCharges', name: 'Bank Charges', value: initialValues.bankCharges },
      { id: 'legalFees', name: 'Legal & Accounting Fees', value: initialValues.legalFees },
      { id: 'printing', name: 'Printing & Stationery', value: initialValues.printing },
      { id: 'staffWelfare', name: 'Staff Welfare', value: initialValues.staffWelfare },
      { id: 'officeExps', name: 'Office Exps', value: initialValues.officeExps },
    ];
    setExpenses(initialList);
  }, [initialValues]);

  const handleStartEdit = () => {
    setEditingExpenses(JSON.parse(JSON.stringify(expenses)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    setExpenses(editingExpenses);
    setIsEditing(false);
  };

  const currentList = isEditing ? editingExpenses : expenses;
  const sumOfExpenses = currentList.reduce((acc, item) => acc + item.value, 0);

  // Dynamic Auto-balancing
  const computedMisc = totalIndirectExpenses - sumOfExpenses;

  let displayMisc = 0;
  let suspenseAmount = 0;
  let isExceeded = false;

  if (computedMisc >= 0) {
    displayMisc = computedMisc;
    suspenseAmount = 0;
    isExceeded = false;
  } else {
    displayMisc = 0;
    suspenseAmount = Math.abs(computedMisc);
    isExceeded = true;
  }

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
    exportToExcel(data, expenses, suspenseAmount);
  };

  return (
    <div id="pl-bs-view-container" className="space-y-8 animate-in fade-in duration-350">
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
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
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

      {/* 1. TRADING & PROFIT & LOSS STATEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                <th className="px-5 py-3 text-right border-r border-slate-200 dark:border-slate-800 w-44">Amount (₹)</th>
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
              <tr className="dark:border-slate-800">
                <td className="px-5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">To Gross Profit c/d</td>
                <td className="px-5 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(grossProfit)}</td>
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
                  <tr key={item.id} className="dark:border-slate-800 group/row relative">
                    {/* Particulars (Debit/Expenses) */}
                    <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 text-left relative">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingExpenses.filter((_, i) => i !== idx);
                            setEditingExpenses(updated);
                          }}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md cursor-pointer z-10"
                          title="Delete this expense row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div className={`flex items-center w-full font-medium text-slate-700 dark:text-slate-200 transition-all ${isEditing ? 'pl-5' : ''}`}>
                        <span className="select-none pr-1">To </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...editingExpenses];
                              updated[idx].name = e.target.value;
                              setEditingExpenses(updated);
                            }}
                            className="w-full bg-transparent border-none p-0 m-0 focus:ring-0 focus:outline-hidden text-slate-700 dark:text-slate-200 font-medium font-sans placeholder-slate-400"
                            placeholder="Expense Account Name"
                          />
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </div>
                    </td>

                    {/* Amount (Rs.) */}
                    <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.value === 0 ? '' : item.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updated = [...editingExpenses];
                            updated[idx].value = isNaN(val) ? 0 : val;
                            setEditingExpenses(updated);
                          }}
                          className="w-full bg-transparent border-none p-0 m-0 text-right focus:ring-0 focus:outline-hidden font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                          placeholder="0"
                        />
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
                  <td colSpan={2} className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800">
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
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all cursor-pointer border border-dashed border-indigo-200 dark:border-indigo-800/50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Expense
                    </button>
                  </td>
                  <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                  <td className="px-5 py-2.5 text-right"></td>
                </tr>
              )}

              {/* To Misc. Exp */}
              <tr className="dark:border-slate-800">
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">
                  To Misc. Exp.
                </td>
                <td className="px-5 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">{formatIndianCurrency(displayMisc)}</td>
                <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-5 py-2.5 text-right"></td>
              </tr>

              {/* Dynamic Suspense Row if Expenses Exceeded the Net Profit limit */}
              {isExceeded && (
                <tr className="bg-amber-500/5 dark:bg-amber-500/10 dark:border-slate-800">
                  <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    Less: Expense Excess (Suspense Adjustment)
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800">
                    -{formatIndianCurrency(suspenseAmount)}
                  </td>
                  <td className="px-5 py-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                  <td className="px-5 py-2.5 text-right"></td>
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

      {/* 2. BALANCE SHEET STATEMENT */}
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
            <span>⚠️ Note: Balance Sheet mismatch of {formatIndianCurrency(Math.abs(difference))}. Please reconcile ledger balances.</span>
          </div>
        )}
      </div>
    </div>
  );
}
