import React, { useState, useEffect } from 'react';
import { ITR4Data, Vehicle44AE } from '../types';
import { formatIndianCurrency } from '../utils/taxCalculator';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Truck, 
  Building, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Briefcase,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PresumptiveBusinessViewProps {
  data: ITR4Data;
  onChange: (updated: ITR4Data) => void;
}

const BUSINESS_CODES = [
  { code: '16003', name: '16003 - Software Development & IT Consultancy' },
  { code: '16013', name: '16013 - IT Enabled Services (ITES / BPO)' },
  { code: '05011', name: '05011 - Transport Operators - Goods Carriage (Sec 44AE)' },
  { code: '09028', name: '09028 - Retail Trade - Others & General Merchants' },
  { code: '09005', name: '09005 - Retail Trade of Grocery / FMCG' },
  { code: '16019', name: '16019 - Professional Services - Others' },
  { code: '20010', name: '20010 - Other Services / General Businesses' }
];

export default function PresumptiveBusinessView({
  data,
  onChange
}: PresumptiveBusinessViewProps) {
  
  // Architectural Fix: True Local Draft State for Edit/Cancel mechanics
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ITR4Data>(data);
  const currentData = isEditing ? draft : data;

  useEffect(() => {
    if (!isEditing) setDraft(data);
  }, [data, isEditing]);

  // Prevent alpha characters in number fields (e, E, +, -, .)
  const blockInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Validation Check for Vehicles
  const hasVehicleErrors = (currentData.business44AE?.vehicles || []).some(
    v => !v.registrationNumber || !v.monthsOwned || v.monthsOwned <= 0 || (v.presumptiveIncome > 0 && v.declaredIncome < v.presumptiveIncome)
  );

  // Safe default initializations for accordions
  const has44AD = (currentData.business44AD.turnoverBank + currentData.business44AD.turnoverCash) > 0 || (currentData.business44AD.presumptiveIncomeTotal || 0) > 0;
  const has44ADA = currentData.profession44ADA.grossReceipts > 0 || (currentData.profession44ADA.presumptiveIncome || 0) > 0;
  const has44AE = (currentData.business44AE?.vehicles?.length || 0) > 0 || (currentData.business44AE?.presumptiveIncomeTotal || 0) > 0;
  const hasKP = [
    currentData.business44AD.openingStock, currentData.business44AD.purchases, currentData.business44AD.freight, currentData.business44AD.closingStock,
    currentData.business44AD.capital, currentData.business44AD.securedLoans, currentData.business44AD.unsecuredLoans, currentData.business44AD.sundryCreditors, currentData.business44AD.otherLiabilities,
    currentData.business44AD.fixedAssets, currentData.business44AD.sundryDebtors, currentData.business44AD.bankBalance, currentData.business44AD.cashInHand, currentData.business44AD.advances
  ].some(val => Number(val || 0) > 0);

  const [expanded44AD, setExpanded44AD] = useState<boolean>(has44AD || (!has44ADA && !has44AE));
  const [expanded44ADA, setExpanded44ADA] = useState<boolean>(has44ADA);
  const [expanded44AE, setExpanded44AE] = useState<boolean>(has44AE);
  const [expandedKP, setExpandedKP] = useState<boolean>(has44AD || has44AE);

  // View/Edit State Handlers
  const handleStartEdit = () => {
    setIsEditing(true);
    setExpanded44AD(has44AD || (!has44ADA && !has44AE));
    setExpanded44ADA(has44ADA);
    setExpanded44AE(has44AE);
    setExpandedKP(has44AD || has44AE);
  };

  const handleCancel = () => {
    setDraft(data); // Throw away draft
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    if (hasVehicleErrors) return; // Prevent save if mandatory vehicle fields are empty/invalid
    onChange(draft); // Commit draft to global state
    setIsEditing(false);
  };

  // Helper to update 44AD fields strictly on DRAFT
  const update44AD = (field: string, val: any) => {
    setDraft(prev => {
      const b = { ...prev.business44AD, [field]: val };
      
      if (field === 'turnoverBank' || field === 'turnoverCash') {
        const bank = field === 'turnoverBank' ? Number(val) : b.turnoverBank;
        const cash = field === 'turnoverCash' ? Number(val) : b.turnoverCash;
        b.presumptiveIncomeBank = Math.round(bank * 0.06);
        b.presumptiveIncomeCash = Math.round(cash * 0.08);
        const minSum = b.presumptiveIncomeBank + b.presumptiveIncomeCash;
        if (b.presumptiveIncomeTotal < minSum) b.presumptiveIncomeTotal = minSum;
      }

      b.totalAssets = Number(b.cashInHand||0) + Number(b.bankBalance||0) + Number(b.sundryDebtors||0) + Number(b.closingStock||0) + Number(b.fixedAssets||0) + Number(b.advances||0);
      
      return { ...prev, business44AD: b };
    });
  };

  // Helper to update 44ADA fields strictly on DRAFT
  const update44ADA = (field: string, val: number) => {
    setDraft(prev => {
      const p = { ...prev.profession44ADA, [field]: val };
      if (field === 'grossReceipts') {
        p.presumptiveIncome = Math.round(val * 0.5);
      }
      return { ...prev, profession44ADA: p };
    });
  };

  // Helper to add a blank vehicle strictly on DRAFT
  const addVehicle = () => {
    setDraft(prev => {
      const b44ae = prev.business44AE || { vehicles: [], presumptiveIncomeTotal: 0 };
      const newVehicle: Vehicle44AE = {
        registrationNumber: '',
        isHeavy: false,
        tonnage: 0,
        monthsOwned: 0,
        presumptiveIncome: 0, 
        declaredIncome: 0
      };
      const vehicles = [...(b44ae.vehicles || []), newVehicle];
      return {
        ...prev,
        business44AE: { ...b44ae, vehicles, presumptiveIncomeTotal: vehicles.reduce((s, v) => s + (v.declaredIncome || 0), 0) }
      };
    });
  };

  // Helper to update vehicle strictly on DRAFT
  const updateVehicle = (index: number, key: keyof Vehicle44AE, val: any) => {
    setDraft(prev => {
      const b44ae = prev.business44AE || { vehicles: [], presumptiveIncomeTotal: 0 };
      const vehicles = [...(b44ae.vehicles || [])];
      const vehicle = { ...vehicles[index], [key]: val };

      if (key === 'isHeavy') {
        vehicle.isHeavy = !!val;
        if (!val) vehicle.tonnage = 0; 
      }
      
      if (key === 'isHeavy' || key === 'tonnage' || key === 'monthsOwned') {
        const months = Math.min(12, Math.max(0, Number(vehicle.monthsOwned || 0)));
        vehicle.monthsOwned = months;
        if (vehicle.isHeavy) {
          vehicle.presumptiveIncome = Math.round((Number(vehicle.tonnage) || 0) * 1000 * months);
        } else {
          vehicle.presumptiveIncome = Math.round(7500 * months);
        }
        vehicle.declaredIncome = vehicle.presumptiveIncome;
      }

      vehicles[index] = vehicle;
      return {
        ...prev,
        business44AE: { ...b44ae, vehicles, presumptiveIncomeTotal: vehicles.reduce((s, v) => s + (v.declaredIncome || 0), 0) }
      };
    });
  };

  // Helper to delete vehicle strictly on DRAFT
  const deleteVehicle = (index: number) => {
    setDraft(prev => {
      const b44ae = prev.business44AE || { vehicles: [], presumptiveIncomeTotal: 0 };
      const vehicles = (b44ae.vehicles || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        business44AE: { ...b44ae, vehicles, presumptiveIncomeTotal: vehicles.reduce((s, v) => s + (v.declaredIncome || 0), 0) }
      };
    });
  };

  // Core Math & Statistics for Margin Indicators based on currentData
  const minCalculatedAD = Math.round(currentData.business44AD.turnoverBank * 0.06 + currentData.business44AD.turnoverCash * 0.08);
  const totalTurnoverAD = currentData.business44AD.turnoverBank + currentData.business44AD.turnoverCash;
  const currentMarginAD = totalTurnoverAD > 0 ? (currentData.business44AD.presumptiveIncomeTotal / totalTurnoverAD) * 100 : 0;
  const minRequiredMarginAD = totalTurnoverAD > 0 ? (minCalculatedAD / totalTurnoverAD) * 100 : 6;
  const currentMarginADA = currentData.profession44ADA.grossReceipts > 0 ? (currentData.profession44ADA.presumptiveIncome / currentData.profession44ADA.grossReceipts) * 100 : 0;
  const isADBelowMin = totalTurnoverAD > 0 && currentData.business44AD.presumptiveIncomeTotal < minCalculatedAD;
  const isADABelowMin = currentData.profession44ADA.grossReceipts > 0 && currentData.profession44ADA.presumptiveIncome < Math.round(currentData.profession44ADA.grossReceipts * 0.5);

  const calculatedTotalAssets = 
    Number(currentData.business44AD.cashInHand || 0) +
    Number(currentData.business44AD.bankBalance || 0) +
    Number(currentData.business44AD.sundryDebtors || 0) +
    Number(currentData.business44AD.closingStock || 0) +
    Number(currentData.business44AD.fixedAssets || 0) + 
    Number(currentData.business44AD.advances || 0);

  const totalLiquid = (currentData.business44AD.cashInHand || 0) + (currentData.business44AD.bankBalance || 0);
  let isRatioDisproportionate = false;
  let disproportionReason = '';

  if (totalTurnoverAD > 0 && totalLiquid > 50000) {
    const cashTurnoverPct = currentData.business44AD.turnoverCash / totalTurnoverAD;
    const cashBalancePct = (currentData.business44AD.cashInHand || 0) / totalLiquid;

    if (cashTurnoverPct < 0.10 && cashBalancePct > 0.50) {
      isRatioDisproportionate = true;
      disproportionReason = `Your cash sales represent only ${(cashTurnoverPct * 100).toFixed(1)}% of your turnover, but Cash in Hand represents ${(cashBalancePct * 100).toFixed(1)}% of your total liquid business assets. Maintaining a high physical cash balance when most business is digital is highly disproportionate and may trigger department enquiries on source of funds.`;
    } else if (cashTurnoverPct > 0.60 && cashBalancePct < 0.05 && (currentData.business44AD.cashInHand || 0) > 100000) {
      isRatioDisproportionate = true;
      disproportionReason = `Your cash sales are very high at ${(cashTurnoverPct * 100).toFixed(1)}% of your turnover, but Cash in Hand represents only ${(cashBalancePct * 100).toFixed(1)}% of your total liquid business assets. Ensure that the remaining physical cash was either deposited in bank accounts or spent on documented business expenditure.`;
    }
  }

  // Render Helper for Input vs Text
  const renderNumberField = (value: number | undefined, updateFn: (val: number) => void, isCurrency = false, readOnly = false) => {
    if (isEditing) {
      return (
        <input
          type="number"
          onKeyDown={blockInvalidNumberChars}
          value={value === 0 || !value ? '' : value}
          onChange={(e) => updateFn(Number(e.target.value))}
          readOnly={readOnly}
          className={`w-full h-10 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${readOnly ? 'bg-slate-50 dark:bg-slate-900/60 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-950'}`}
        />
      );
    }
    return (
      <div className="h-10 flex items-center px-1">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {isCurrency ? formatIndianCurrency(value || 0) : (value || '-')}
        </span>
      </div>
    );
  };

  return (
    <div id="presumptive-container" className="space-y-6 animate-in fade-in duration-350">
      
      {/* 1. HEADER SECTION */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Presumptive Income & Business Registry
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
                disabled={hasVehicleErrors}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white rounded-2xl shadow-sm transition-all ${hasVehicleErrors ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'}`}
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CORE BUSINESS PROFILE REGISTRY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Briefcase className="w-4.5 h-4.5 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Business Particulars
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
              Trade Name / Name of Business
            </label>
            {isEditing ? (
              <input
                type="text"
                value={currentData.business44AD.tradeName || ''}
                onChange={(e) => update44AD('tradeName', e.target.value)}
                className="w-full h-10 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            ) : (
              <div className="h-10 flex items-center px-1">
                <span className="font-semibold text-slate-800 dark:text-slate-100 uppercase">
                  {currentData.business44AD.tradeName || '-'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
              Nature of Business Code
            </label>
            {isEditing ? (
              <select
                value={currentData.business44AD.businessCode || ''}
                onChange={(e) => update44AD('businessCode', e.target.value)}
                className="w-full h-10 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              >
                <option value="" disabled className="text-slate-400">-- Select Business Code --</option>
                {BUSINESS_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-10 flex items-center px-1">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {currentData.business44AD.businessCode ? BUSINESS_CODES.find(c => c.code === currentData.business44AD.businessCode)?.name : '-'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTION 44AD ACCORDION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded44AD(!expanded44AD)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SEC 44AD
            </span>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
              Presumptive Business Turnover & Profit
            </h3>
            {!expanded44AD && has44AD && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {expanded44AD ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded44AD && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                        Turnover via Account Payee/Digital Modes
                      </label>
                      <div className="relative group inline-flex items-center ml-1.5 cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] font-medium p-2.5 rounded-xl shadow-xl z-[60] text-center leading-normal normal-case border border-slate-700 dark:border-slate-600">
                          Statutory Minimum Required (6%):<br/>
                          <span className="font-bold text-amber-400">{formatIndianCurrency(currentData.business44AD.presumptiveIncomeBank)}</span>
                        </div>
                      </div>
                    </div>
                    {renderNumberField(currentData.business44AD.turnoverBank, (val) => update44AD('turnoverBank', val), true)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                        Turnover via Any Other Mode (Cash/Bearer)
                      </label>
                      <div className="relative group inline-flex items-center ml-1.5 cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] font-medium p-2.5 rounded-xl shadow-xl z-[60] text-center leading-normal normal-case border border-slate-700 dark:border-slate-600">
                          Statutory Minimum Required (8%):<br/>
                          <span className="font-bold text-amber-400">{formatIndianCurrency(currentData.business44AD.presumptiveIncomeCash)}</span>
                        </div>
                      </div>
                    </div>
                    {renderNumberField(currentData.business44AD.turnoverCash, (val) => update44AD('turnoverCash', val), true)}
                  </div>
                </div>

                {/* Validation Alerts (Visible in both views if data is invalid) */}
                {currentData.business44AD.turnoverBank > 30000000 && (
                  <div className="flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-xs">Section 44AD Eligibility Alert</p>
                      <p className="text-[10px] font-medium opacity-90 mt-0.5 leading-normal">
                        Your Digital turnover exceeds the ₹3 Crore limit. The Section 44AD presumptive scheme is not applicable.
                      </p>
                    </div>
                  </div>
                )}
                {currentData.business44AD.turnoverCash > 2000000 && (
                  <div className="flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-xs">High Cash Turnover Warning</p>
                      <p className="text-[10px] font-medium opacity-90 mt-0.5 leading-normal">
                        Cash turnover exceeds ₹20 Lakhs. Overall presumptive eligibility threshold is capped at ₹2 Crore instead of ₹3 Crore.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`p-4 rounded-2xl space-y-3 ${isEditing ? 'bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800' : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                        Income Declared u/s 44AD
                      </label>
                      {!isEditing && (
                        <span className="text-xs text-slate-500 font-medium">
                          Min Req: {formatIndianCurrency(minCalculatedAD)}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        onKeyDown={blockInvalidNumberChars}
                        value={currentData.business44AD.presumptiveIncomeTotal || ''}
                        onChange={(e) => update44AD('presumptiveIncomeTotal', Number(e.target.value))}
                        className={`w-full h-10 px-3 text-sm font-bold rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                          totalTurnoverAD > 0 
                            ? isADBelowMin
                              ? 'text-red-900 dark:text-red-200 bg-red-50/30 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-900/60 focus:ring-red-500 focus:border-red-500'
                              : 'text-emerald-950 dark:text-emerald-100 bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'text-slate-950 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm'
                        }`}
                      />
                    ) : (
                      <div className="h-10 flex items-center">
                        <span className={`text-lg font-black ${isADBelowMin ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {formatIndianCurrency(currentData.business44AD.presumptiveIncomeTotal)}
                        </span>
                      </div>
                    )}
                    
                    {/* Live Margin Indicator */}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {totalTurnoverAD > 0 ? (
                        currentMarginAD >= minRequiredMarginAD ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Current Margin: {currentMarginAD.toFixed(2)}% (Legal Limit OK)
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-500/10 border border-red-500/15 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            Current Margin: {currentMarginAD.toFixed(2)}% (Below statutory min of {minRequiredMarginAD.toFixed(2)}%)
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. SECTION 44ADA ACCORDION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded44ADA(!expanded44ADA)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SEC 44ADA
            </span>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
              Presumptive Professional Receipts & Profit
            </h3>
            {!expanded44ADA && has44ADA && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {expanded44ADA ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded44ADA && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Gross Receipts from Profession (u/s 44ADA)
                    </label>
                    <div className="relative group inline-flex items-center ml-1.5 cursor-help">
                      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] font-medium p-2.5 rounded-xl shadow-xl z-[60] text-center leading-normal normal-case border border-slate-700 dark:border-slate-600">
                        Statutory Minimum Required (50%):<br/>
                        <span className="font-bold text-amber-400">{formatIndianCurrency(Math.round(currentData.profession44ADA.grossReceipts * 0.5))}</span>
                      </div>
                    </div>
                  </div>
                  {renderNumberField(currentData.profession44ADA.grossReceipts, (val) => update44ADA('grossReceipts', val), true)}
                </div>

                {currentData.profession44ADA.grossReceipts > 7500000 && (
                  <div className="flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl my-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-xs">Section 44ADA Eligibility Alert</p>
                      <p className="text-[10px] font-medium opacity-90 mt-0.5 leading-normal">
                        Gross receipts exceed the ₹75 Lakhs threshold. Section 44ADA presumptive taxation is not available.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`p-4 rounded-2xl space-y-3 ${isEditing ? 'bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800' : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                        Income Declared u/s 44ADA
                      </label>
                      {!isEditing && (
                        <span className="text-xs text-slate-500 font-medium">
                          Min Req: {formatIndianCurrency(Math.round(currentData.profession44ADA.grossReceipts * 0.5))}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        onKeyDown={blockInvalidNumberChars}
                        value={currentData.profession44ADA.presumptiveIncome || ''}
                        onChange={(e) => update44ADA('presumptiveIncome', Number(e.target.value))}
                        className={`w-full h-10 px-3 text-sm font-bold rounded-lg focus:outline-hidden focus:ring-1 transition-all ${
                          currentData.profession44ADA.grossReceipts > 0
                            ? isADABelowMin
                              ? 'text-red-900 dark:text-red-200 bg-red-50/30 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-900/60 focus:ring-red-500 focus:border-red-500'
                              : 'text-emerald-950 dark:text-emerald-100 bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 shadow-sm'
                        }`}
                      />
                    ) : (
                      <div className="h-10 flex items-center">
                        <span className={`text-lg font-black ${isADABelowMin ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {formatIndianCurrency(currentData.profession44ADA.presumptiveIncome)}
                        </span>
                      </div>
                    )}
                    
                    {/* Live Margin Indicator */}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {currentData.profession44ADA.grossReceipts > 0 ? (
                        currentMarginADA >= 50 ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Current Margin: {currentMarginADA.toFixed(2)}% (Legal Limit OK)
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-500/10 border border-red-500/15 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            Current Margin: {currentMarginADA.toFixed(2)}% (Below legal min of 50.0%)
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. SECTION 44AE ACCORDION (TRANSPORT BUSINESS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded44AE(!expanded44AE)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SEC 44AE
            </span>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
              Presumptive Transport Business (u/s 44AE)
            </h3>
            {!expanded44AE && has44AE && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {expanded44AE ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded44AE && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                
                {(currentData.business44AE?.vehicles || []).length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      No Goods Carriage Assets Added
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-2 w-32">Reg. Number</th>
                          <th className="py-2.5 px-2 w-48">Carriage Type</th>
                          <th className="py-2.5 px-2 w-20">Tonnage</th>
                          <th className="py-2.5 px-2 w-24 text-center">Months</th>
                          <th className="py-2.5 px-2 w-28 text-right">Computed Min</th>
                          <th className="py-2.5 pl-3 w-36 text-right">Deemed Income</th>
                          {isEditing && <th className="py-2.5 text-center w-12">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {(currentData.business44AE?.vehicles || []).map((vehicle, idx) => {
                          // Validation checks for this specific row
                          const isError = (vehicle.presumptiveIncome > 0 && vehicle.declaredIncome < vehicle.presumptiveIncome) || !vehicle.registrationNumber || !vehicle.monthsOwned;
                          
                          return (
                            <React.Fragment key={idx}>
                              <tr className="align-middle">
                                <td className="py-3 pr-2">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={vehicle.registrationNumber || ''}
                                      onChange={(e) => updateVehicle(idx, 'registrationNumber', e.target.value.toUpperCase())}
                                      className={`w-full px-2 py-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border ${!vehicle.registrationNumber ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:outline-hidden text-slate-800 dark:text-slate-200`}
                                      placeholder="e.g. TN01AB1234"
                                    />
                                  ) : (
                                    <span className="font-semibold">{vehicle.registrationNumber || '-'}</span>
                                  )}
                                </td>

                                <td className="py-3 px-2">
                                  {isEditing ? (
                                    <select
                                      value={vehicle.isHeavy ? 'HEAVY' : 'LIGHT'}
                                      onChange={(e) => updateVehicle(idx, 'isHeavy', e.target.value === 'HEAVY')}
                                      className="w-full px-2 py-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden text-slate-800 dark:text-slate-200"
                                    >
                                      <option value="LIGHT">Light Goods Vehicle</option>
                                      <option value="HEAVY">Heavy Carriage (&gt; 12 MT)</option>
                                    </select>
                                  ) : (
                                    <span>{vehicle.isHeavy ? 'Heavy Goods Carriage' : 'Light Goods Vehicle'}</span>
                                  )}
                                </td>

                                <td className="py-3 px-2">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      disabled={!vehicle.isHeavy}
                                      onKeyDown={blockInvalidNumberChars}
                                      placeholder="N/A"
                                      value={vehicle.isHeavy ? (vehicle.tonnage || '') : ''}
                                      onChange={(e) => updateVehicle(idx, 'tonnage', Number(e.target.value))}
                                      className={`w-full px-2 py-1.5 text-xs font-semibold border rounded-lg focus:outline-hidden ${
                                        vehicle.isHeavy 
                                          ? 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200' 
                                          : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/20 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                      }`}
                                    />
                                  ) : (
                                    <span>{vehicle.isHeavy ? vehicle.tonnage : 'N/A'}</span>
                                  )}
                                </td>

                                <td className="py-3 px-2">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max="12"
                                      onKeyDown={blockInvalidNumberChars}
                                      value={vehicle.monthsOwned || ''}
                                      onChange={(e) => updateVehicle(idx, 'monthsOwned', Number(e.target.value))}
                                      className={`w-full px-2 py-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border ${!vehicle.monthsOwned || vehicle.monthsOwned <= 0 ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:outline-hidden text-slate-800 dark:text-slate-200 text-center`}
                                      placeholder="1-12"
                                    />
                                  ) : (
                                    <span className="block text-center">{vehicle.monthsOwned}</span>
                                  )}
                                </td>

                                <td className="py-3 px-2 text-right font-semibold text-slate-400 dark:text-slate-500">
                                  {formatIndianCurrency(vehicle.presumptiveIncome)}
                                </td>

                                <td className="py-3 pl-3">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      onKeyDown={blockInvalidNumberChars}
                                      value={vehicle.declaredIncome || ''}
                                      onChange={(e) => updateVehicle(idx, 'declaredIncome', Number(e.target.value))}
                                      className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg focus:outline-hidden text-right ${
                                        (vehicle.presumptiveIncome > 0 && vehicle.declaredIncome < vehicle.presumptiveIncome)
                                          ? 'bg-red-50/30 dark:bg-red-950/20 border-2 border-red-400 text-red-900 dark:text-red-200'
                                          : 'bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                                      }`}
                                    />
                                  ) : (
                                    <span className={`block text-right font-bold ${
                                      (vehicle.presumptiveIncome > 0 && vehicle.declaredIncome < vehicle.presumptiveIncome) 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-slate-900 dark:text-slate-100'
                                    }`}>
                                      {formatIndianCurrency(vehicle.declaredIncome)}
                                    </span>
                                  )}
                                </td>

                                {isEditing && (
                                  <td className="py-3 text-center">
                                    <button
                                      onClick={() => deleteVehicle(idx)}
                                      className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                                      title="Remove carriage"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                              
                              {/* Audit Risk Row explicitly mapping to this vehicle */}
                              {isError && (
                                <tr>
                                  <td colSpan={isEditing ? 7 : 6} className="pb-3 px-2">
                                    <div className="flex items-center gap-2 text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-500/10 border border-red-500/15 px-3 py-1.5 rounded-lg w-full">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      {(!vehicle.registrationNumber || !vehicle.monthsOwned) 
                                        ? 'Error: Registration Number and Months Owned are mandatory.' 
                                        : 'Tax Audit Risk: Declared income is below the statutory Section 44AE limit for this vehicle.'}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2">
                  {isEditing ? (
                    <button
                      onClick={addVehicle}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Goods Carriage
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="text-right text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold mr-1.5">
                      Total Deemed Profit u/s 44AE:
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatIndianCurrency(currentData.business44AE?.presumptiveIncomeTotal || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. FINANCIAL PARTICULARS (SCHEDULE BP) ACCORDION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedKP(!expandedKP)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-hidden"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-md">
              SCHEDULE BP
            </span>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
              Financial Particulars of the Business (Schedule BP)
            </h3>
            {!expandedKP && hasKP && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {expandedKP ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expandedKP && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-6">
                
                {/* TRADING PARTICULARS */}
                <div>
                  <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    Trading Account Particulars
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Opening Stock</label>
                      {renderNumberField(currentData.business44AD.openingStock, (val) => update44AD('openingStock', val), true)}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Purchases</label>
                      {renderNumberField(currentData.business44AD.purchases, (val) => update44AD('purchases', val), true)}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Freight / Direct Exp</label>
                      {renderNumberField(currentData.business44AD.freight, (val) => update44AD('freight', val), true)}
                    </div>
                  </div>
                </div>

                {/* BALANCE SHEET PARTICULARS */}
                <div className="border-t border-slate-100 dark:border-slate-800/40 pt-5 space-y-6">
                  <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    Balance Sheet Particulars
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* LIABILITIES COLUMN */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                          Liabilities
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Proprietor's Capital</label>
                          {renderNumberField(currentData.business44AD.capital, (val) => update44AD('capital', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Secured Loans</label>
                          {renderNumberField(currentData.business44AD.securedLoans, (val) => update44AD('securedLoans', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Unsecured Loans</label>
                          {renderNumberField(currentData.business44AD.unsecuredLoans, (val) => update44AD('unsecuredLoans', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Sundry Creditors</label>
                          {renderNumberField(currentData.business44AD.sundryCreditors, (val) => update44AD('sundryCreditors', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Other Liabilities</label>
                          {renderNumberField(currentData.business44AD.otherLiabilities, (val) => update44AD('otherLiabilities', val), true)}
                        </div>
                      </div>
                    </div>

                    {/* ASSETS COLUMN */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                          Assets
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Fixed Assets</label>
                          {renderNumberField(currentData.business44AD.fixedAssets, (val) => update44AD('fixedAssets', val), true)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center pb-0.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Inventories (Closing Stock)</label>
                            <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-wider">From Trading</span>
                          </div>
                          {renderNumberField(currentData.business44AD.closingStock, (val) => update44AD('closingStock', val), true, true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Sundry Debtors</label>
                          {renderNumberField(currentData.business44AD.sundryDebtors, (val) => update44AD('sundryDebtors', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Bank Balance</label>
                          {renderNumberField(currentData.business44AD.bankBalance, (val) => update44AD('bankBalance', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Cash in Hand</label>
                          {renderNumberField(currentData.business44AD.cashInHand, (val) => update44AD('cashInHand', val), true)}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Loans & Advances Given</label>
                          {renderNumberField(currentData.business44AD.advances, (val) => update44AD('advances', val), true)}
                        </div>
                      </div>

                      {/* Total Assets */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center pb-0.5">
                            <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Gross Total Assets</label>
                            <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-wider">Auto-calculated</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="number"
                              value={calculatedTotalAssets || ''}
                              readOnly
                              className="w-full h-10 px-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-950 rounded-lg cursor-not-allowed focus:outline-hidden shadow-sm"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-1">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                {formatIndianCurrency(calculatedTotalAssets)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Auditing Warning alerts */}
                  {isRatioDisproportionate && (
                    <div className="flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl mt-4">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-xs">Disproportionate Cash Asset Ratio Warning</p>
                        <p className="text-[10px] font-medium opacity-90 mt-0.5 leading-normal">
                          {disproportionReason} Consider aligning your cash-in-hand to a reasonable level or depositing cash surpluses into your bank account.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}