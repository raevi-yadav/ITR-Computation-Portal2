import React, { useState, useEffect } from 'react';
import { ITR4Data, PersonalDetails, BankDetails } from '../types';
import { Edit2, Check, X } from 'lucide-react';

interface PersonalDetailsViewProps {
  data: ITR4Data;
  onChange: (updated: ITR4Data) => void;
}

export default function PersonalDetailsView({ data, onChange }: PersonalDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Manage two separate drafts to match your TypeScript interfaces
  const [draftPersonal, setDraftPersonal] = useState<PersonalDetails>(data.personal);
  // Note: Adjust "data.bank" to "data.bankDetails" below if your main ITR4Data interface uses that key.
  const [draftBank, setDraftBank] = useState<BankDetails>(data.bank); 

  // Sync drafts if data changes externally while not editing
  useEffect(() => {
    if (!isEditing) {
      setDraftPersonal(data.personal);
      setDraftBank(data.bank); 
    }
  }, [data.personal, data.bank, isEditing]);

  const handleStartEdit = () => {
    setDraftPersonal(data.personal);
    setDraftBank(data.bank);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftPersonal(data.personal);
    setDraftBank(data.bank);
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    onChange({
      ...data,
      personal: draftPersonal,
      bank: draftBank
    });
    setIsEditing(false);
  };

  // Helper for Personal Details (Strictly bound to keyof PersonalDetails)
  const renderPersonalField = (
    fieldKey: keyof PersonalDetails, 
    placeholder: string, 
    transformClass: string = '', 
    type: string = 'text'
  ) => {
    if (isEditing) {
      return (
        <input
          type={type}
          value={draftPersonal[fieldKey] || ''}
          onChange={(e) => setDraftPersonal({ ...draftPersonal, [fieldKey]: e.target.value })}
          className={`w-full px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm ${transformClass}`}
        />
      );
    }
    return (
      <span className={`font-semibold text-slate-800 dark:text-slate-100 ${transformClass}`}>
        {draftPersonal[fieldKey] || '-'}
      </span>
    );
  };

  // Helper for Bank Details (Strictly bound to keyof BankDetails)
  const renderBankField = (
    fieldKey: keyof BankDetails, 
    placeholder: string, 
    transformClass: string = '', 
    type: string = 'text'
  ) => {
    if (isEditing) {
      return (
        <input
          type={type}
          value={draftBank[fieldKey] || ''}
          onChange={(e) => setDraftBank({ ...draftBank, [fieldKey]: e.target.value })}
          className={`w-full px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm ${transformClass}`}
        />
      );
    }
    return (
      <span className={`font-semibold text-slate-800 dark:text-slate-100 ${transformClass}`}>
        {draftBank[fieldKey] || '-'}
      </span>
    );
  };

  const labelClass = "px-5 py-3.5 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/4 select-none";
  const valueClass = "px-5 py-3.5 border-r border-slate-200 dark:border-slate-800 w-1/4";

  return (
    <div id="personal-details-container" className="space-y-8 animate-in fade-in duration-350">
      
      {/* HEADER WITH ACTION BUTTONS */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Assessee Profile
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

      {/* 1. ASSESSEE DEMOGRAPHICS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-tight">
            Assessee Demographics
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Full Name</td>
                <td className={valueClass}>{renderPersonalField('name', 'Full Name', 'capitalize')}</td>
                <td className={labelClass}>PAN</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('pan', 'ABCDE1234F', 'uppercase')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Date of Birth</td>
                <td className={valueClass}>{renderPersonalField('dob', 'YYYY-MM-DD', '', 'date')}</td>
                <td className={labelClass}>Aadhaar Number</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('aadhaar', '[Redacted Placeholder]')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Mobile Number</td>
                <td className={valueClass}>{renderPersonalField('mobile', '9876543210')}</td>
                <td className={labelClass}>Email Address</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('email', 'demo@example.com', 'lowercase')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Filed Under Section</td>
                <td className={valueClass}>{renderPersonalField('filingSection', '139(1)')}</td>
                <td className={labelClass}>Filing Due Date</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('dueDate', 'YYYY-MM-DD', '', 'date')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Assessment Year</td>
                <td className={valueClass}>{renderPersonalField('assessmentYear', '2026-27')}</td>
                <td className={labelClass}>Financial Year</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('financialYear', '2025-26')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Father's Name</td>
                <td className={valueClass}>{renderPersonalField('fatherName', "Father's Name", 'capitalize')}</td>
                <td className={labelClass}>Filing Place</td>
                <td className={`${valueClass} border-r-0`}>{renderPersonalField('place', 'City', 'uppercase')}</td>
              </tr>
              
              {/* SPANNING GRID ROW FOR ADDRESS */}
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Complete Address</td>
                <td colSpan={3} className="px-5 py-3.5 border-none">
                  {renderPersonalField('address', 'Full Residential / Office Address', 'capitalize')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. BANK DETAILS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-tight">
            Bank Details (For Refund)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Bank Name</td>
                <td className={valueClass}>{renderBankField('bankName', 'State Bank of India', 'uppercase')}</td>
                <td className={labelClass}>IFSC Code</td>
                <td className={`${valueClass} border-r-0`}>{renderBankField('ifsc', 'SBIN0000001', 'uppercase')}</td>
              </tr>
              <tr className="dark:border-slate-800">
                <td className={labelClass}>Account Number</td>
                <td className={valueClass}>{renderBankField('accountNumber', '1234567890')}</td>
                <td className={labelClass}></td>
                <td className="px-5 py-3.5 border-none"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}