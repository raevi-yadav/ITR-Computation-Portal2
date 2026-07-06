import React from 'react';
import { ITR4Data } from '../types';

interface PersonalBankViewProps {
  data: ITR4Data;
  onChange: (updated: ITR4Data) => void;
}

export default function PersonalBankView({ data, onChange }: PersonalBankViewProps) {
  const updatePersonal = (field: string, value: string) => {
    const updated = { ...data };
    updated.personal = { ...updated.personal, [field]: value };
    onChange(updated);
  };

  const updateBank = (field: string, value: string) => {
    const updated = { ...data };
    updated.bank = { ...updated.bank, [field]: value };
    onChange(updated);
  };

  const personalFields = [
    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'DEMO CLIENT' },
    { label: 'PAN', key: 'pan', type: 'text', placeholder: 'ABCDE1234F', uppercase: true },
    { label: 'Date of Birth', key: 'dob', type: 'date' },
    { label: 'Aadhaar Number', key: 'aadhaar', type: 'text', placeholder: '999999999999' },
    { label: 'Mobile Number', key: 'mobile', type: 'tel', placeholder: '9876543210' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'demo.client@example.com' },
    { label: 'Filing Section Code', key: 'filingSection', type: 'text', placeholder: '11 (139(1))' },
    { label: 'Filing Due Date', key: 'dueDate', type: 'date' },
    { label: 'Assessment Year', key: 'assessmentYear', type: 'text', placeholder: '2026-27' },
    { label: 'Financial Year', key: 'financialYear', type: 'text', placeholder: '2025-26' },
    { label: "Father's Name", key: 'fatherName', type: 'text', placeholder: 'Father Name' },
    { label: 'Filing Place', key: 'place', type: 'text', placeholder: 'LUCKNOW' },
  ];

  const bankFields = [
    { label: 'Bank Name', key: 'bankName', placeholder: 'STATE BANK OF INDIA' },
    { label: 'IFSC Code', key: 'ifsc', placeholder: 'SBIN0000001', uppercase: true },
    { label: 'Account Number', key: 'accountNumber', placeholder: '1234567890' },
  ];

  return (
    <div id="personal-bank-container" className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Personal & Bank Details
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Auto-filled from uploaded JSON. You can modify these values below to live-update calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal details card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800">
            Assessee Demographics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={(data.personal as any)[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (field.uppercase) val = val.toUpperCase();
                    updatePersonal(field.key, val);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Complete Address
            </label>
            <textarea
              rows={2}
              value={data.personal.address || ''}
              onChange={(e) => updatePersonal('address', e.target.value)}
              placeholder="101, SAMPLE TOWER, MAIN ROAD, DEMO AREA, LUCKNOW, State 09, 226001"
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
            />
          </div>
        </div>

        {/* Bank & Filing Details */}
        <div className="space-y-6">
          {/* Bank Details */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800">
              Bank Details (For Refund)
            </h2>
            
            <div className="space-y-4">
              {bankFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(data.bank as any)[field.key] || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (field.uppercase) val = val.toUpperCase();
                      updateBank(field.key, val);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Static details helper */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/30 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
              ITR-4 Section Guidelines
            </h4>
            <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
              ITR-4 (Sugam) is filed by individuals, HUFs, and Partnership firms (other than LLPs) who are residents having total income up to ₹50 Lakh and having presumptive business/professional income u/s 44AD, 44ADA or 44AE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
