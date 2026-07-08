import React, { useState, useEffect } from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, calculateTax, TaxResult } from '../utils/taxCalculator';
import { Printer, Edit2, Check, X, FileText } from 'lucide-react';
import QRCode from 'qrcode';

interface ComputationPdfViewProps {
  data: ITR4Data;
  taxResult: TaxResult;
  onPrint: () => void;
}

export default function ComputationPdfView({ data, taxResult, onPrint }: ComputationPdfViewProps) {
  const p = data.personal;
  const b = data.bank;
  const bus = data.business44AD;
  
  // Safe extraction for new heads
  const hpIncome = data.houseProperty?.netHPIncome || 0;
  const transportIncome = data.business44AE?.presumptiveIncomeTotal || 0;
  
  // Local state for header-based Ack No editing
  const [ackNo, setAckNo] = useState(p.ackNo || '');
  const [isEditingAck, setIsEditingAck] = useState(false);
  const [tempAck, setTempAck] = useState('');
  
  const hasAckNo = Boolean(ackNo && ackNo.trim() !== '');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Utility to format YYYY-MM-DD to DD-MM-YYYY natively
  const formatStandardDate = (dateString: string) => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  useEffect(() => {
    const generateQrCode = async () => {
      try {
        const refundOrPayable = taxResult.refundAmount > 0 
          ? `Refund Due: ${formatIndianCurrency(taxResult.refundAmount)}` 
          : `Tax Payable: ${formatIndianCurrency(taxResult.payableAmount)}`;

        const ackText = hasAckNo ? `Ack No: ${ackNo}` : `Status: DRAFT / UNFILED`;

        const summaryText = `ITR-4 COMPUTATION SUMMARY
-------------------------
Name: ${p.name.toUpperCase()}
PAN: ${p.pan.toUpperCase()}
AY: ${p.assessmentYear} (FY: ${p.financialYear})
${ackText}
Regime: ${data.regime}
Gross Total Income: ${formatIndianCurrency(taxResult.grossTotalIncome)}
Total Taxable Income: ${formatIndianCurrency(taxResult.totalIncome)}
${refundOrPayable}
Bank Name: ${b.bankName.toUpperCase()}
Account No: ${b.accountNumber}
Filing Section: Section ${p.filingSection || '139(1)'}`;

        const url = await QRCode.toDataURL(summaryText, {
          margin: 1,
          width: 100,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQrCode();
  }, [p, b, taxResult, data.regime, ackNo, hasAckNo]);

  // Handlers for the Header Ack No Editor
  const handleStartEdit = () => {
    setTempAck(ackNo);
    setIsEditingAck(true);
  };

  const handleSaveAck = () => {
    setAckNo(tempAck);
    setIsEditingAck(false);
  };

  const handleCancelAck = () => {
    setIsEditingAck(false);
  };

  return (
    <div id="computation-pdf-container" className="space-y-6">
      
      {/* Visual Header in UI (Hidden in printing) */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Professional Computation Report
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Header Action Bar: Ack No Editor */}
          <div className="flex items-center h-10">
            {isEditingAck ? (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-600 pl-3 pr-1 py-1 rounded-xl shadow-sm ring-2 ring-indigo-500/20 transition-all h-full">
                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <input
                  type="text"
                  value={tempAck}
                  onChange={(e) => setTempAck(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAck();
                    if (e.key === 'Escape') handleCancelAck();
                  }}
                  className="w-48 px-2 text-xs font-semibold uppercase outline-hidden bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400"
                  placeholder="Enter Ack No..."
                  autoFocus
                />
                <button 
                  onClick={handleSaveAck} 
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleCancelAck} 
                  className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  title="Discard"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-4 pr-1.5 py-1.5 rounded-xl shadow-sm h-full transition-all">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${hasAckNo ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {hasAckNo ? ackNo : 'Draft/Ack No'}
                  </span>
                </div>
                <button 
                  onClick={handleStartEdit}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer border border-transparent"
                  title="Edit Acknowledgement Number"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-5 py-2.5 h-10 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Styled A4 sheet mockup for screen display */}
      <div 
        id="printable-computation-document"
        className="mx-auto w-full max-w-[800px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm relative print:shadow-none print:border-none print:p-0 print:max-w-none print:bg-transparent"
      >
        <div className="border border-slate-200 dark:border-slate-700 p-6 rounded-2xl print:border-none print:p-0">
          
          {/* Main Document Header Block */}
          <div className="text-center space-y-2.5 border-b-2 border-indigo-600 dark:border-indigo-500 pb-5">
            <h2 className="text-2xl font-black tracking-widest text-slate-900 dark:text-white uppercase">
              COMPUTATION OF TOTAL INCOME
            </h2>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-full">
                M/S. {p.name} | PAN: {p.pan}
              </h3>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tracking-widest uppercase mt-1">
                ITR-4 | Assessment Year {p.assessmentYear} | Financial Year {p.financialYear}
              </p>
              
              {/* Static Status Badge (Reflects header changes) */}
              <div className="mt-1.5 h-5 flex justify-center items-center">
                {hasAckNo ? (
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-md">
                    Ack No: {ackNo}
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 rounded-md">
                    Status: Draft / Unfiled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 Quadrants Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden mt-6 text-[11px] leading-relaxed">
            
            {/* ASSESSEE DETAILS */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-2">
              <h4 className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-[10px] pb-1 border-b border-slate-200 dark:border-slate-800 mb-2">
                ASSESSEE DETAILS
              </h4>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-right">{p.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">PAN:</span>
                <span className="font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase text-right">{p.pan}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">DOB:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formatStandardDate(p.dob)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">Aadhaar:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{p.aadhaar}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">Mobile:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{p.mobile}</span>
              </div>
            </div>

            {/* ADDRESS & FILING */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-2">
              <h4 className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-[10px] pb-1 border-b border-slate-200 dark:border-slate-800 mb-2">
                ADDRESS & FILING
              </h4>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Address:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase leading-snug text-right pl-2">{p.address}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-right">{p.email}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Filed u/s:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right">Section {p.filingSection || '139(1)'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Due Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formatStandardDate(p.dueDate)}</span>
              </div>
            </div>

            {/* BANK FOR REFUND */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-2">
              <h4 className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-[10px] pb-1 border-b border-slate-200 dark:border-slate-800 mb-2">
                BANK FOR REFUND
              </h4>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">Bank:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-right">{b.bankName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">IFSC:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wider uppercase text-right">{b.ifsc}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-24">A/c No:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wide text-right">{b.accountNumber}</span>
              </div>
            </div>

            {/* VERIFICATION */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-2">
              <h4 className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-[10px] pb-1 border-b border-slate-200 dark:border-slate-800 mb-2">
                VERIFICATION
              </h4>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-right">{p.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Place:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-right">{p.place}</span>
              </div>
              <div className="flex justify-between items-start mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 w-20">Status:</span>
                <span className={`font-bold uppercase text-right ${hasAckNo ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-500'}`}>
                  {hasAckNo ? `Ack: ${ackNo}` : 'DRAFT / UNFILED'}
                </span>
              </div>
            </div>
          </div>

          {/* Three Summary Cards - Higher Contrast */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50/80 dark:bg-slate-800/40">
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">GROSS TOTAL INCOME</span>
              <p className="text-sm font-black text-indigo-700 dark:text-indigo-400 mt-1">{formatIndianCurrency(taxResult.grossTotalIncome)}</p>
            </div>
            <div className="p-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50/80 dark:bg-slate-800/40">
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">TOTAL INCOME</span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{formatIndianCurrency(taxResult.totalIncome)}</p>
            </div>
            <div className="p-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50/80 dark:bg-slate-800/40">
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Tax Payable/Refund</span>
              <p className={`text-sm font-black mt-1 ${taxResult.payableAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {taxResult.payableAmount > 0 
                  ? `+${formatIndianCurrency(taxResult.payableAmount)}` 
                  : taxResult.refundAmount > 0 
                    ? `-${formatIndianCurrency(taxResult.refundAmount)}` 
                    : '₹0'}
              </p>
            </div>
          </div>

          {/* Detailed Calculations */}
          <div className="mt-6 space-y-5 text-[11px] leading-relaxed print-page-break-before print:mt-4">
            
            {/* SALARY COMPUTATION */}
            {(taxResult.salaryIncome > 0 || data.salary.grossSalary > 0) && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                  SALARY INCOME COMPUTATION
                </div>
                <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Gross Salary:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.salary.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 pl-4 font-medium">Less: Standard Deduction u/s 16(ia):</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">-{formatIndianCurrency(data.regime === 'NEW' ? 75000 : 50000)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold text-slate-900 dark:text-white">
                    <span>Income from Salary:</span>
                    <span>{formatIndianCurrency(taxResult.salaryIncome)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* HOUSE PROPERTY COMPUTATION */}
            {hpIncome !== 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                  HOUSE PROPERTY COMPUTATION
                </div>
                <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Income / (Loss) from House Property:</span>
                    <span>{formatIndianCurrency(hpIncome)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS / PROFESSION COMPUTATION */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                BUSINESS / PROFESSION COMPUTATION
              </div>
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">44AD Gross Turnover:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(bus.turnoverBank + bus.turnoverCash)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Bank/Digital Turnover:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatIndianCurrency(bus.turnoverBank)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Cash/Other Turnover:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatIndianCurrency(bus.turnoverCash)}</span>
                  </div>
                </div>
                
                {/* Visual breathing room added here */}
                <div className="flex justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/60 pb-1">
                  <span className="text-slate-800 dark:text-slate-200 font-bold">44AD Declared Presumptive Income:</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatIndianCurrency(bus.presumptiveIncomeTotal)}</span>
                </div>
                
                {data.profession44ADA.grossReceipts > 0 && (
                  <>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">44ADA Gross Receipts:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.profession44ADA.grossReceipts)}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-800 dark:text-slate-200 font-bold">44ADA Declared Presumptive Income:</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatIndianCurrency(data.profession44ADA.presumptiveIncome)}</span>
                    </div>
                  </>
                )}

                {transportIncome > 0 && (
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 pb-1">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">44AE (Transport) Presumptive Income:</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatIndianCurrency(transportIncome)}</span>
                  </div>
                )}

                {/* Balance Sheet Extract */}
                <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 mt-2 rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-200 dark:border-slate-700 pb-1 mb-1">Schedule BP Extract</span>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Cash in Hand:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatIndianCurrency(bus.cashInHand)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Gross Total Assets:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatIndianCurrency(bus.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER SOURCES DETAILS */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                OTHER SOURCES DETAILS
              </div>
              <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Savings Bank Interest (SAV):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.otherSources.interestSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Other Interest/Incomes (OTH):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.otherSources.interestOthers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Dividend Income (DIV):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.otherSources.dividendIncome)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold text-slate-900 dark:text-white">
                  <span>Total Other Sources Income:</span>
                  <span>{formatIndianCurrency(taxResult.otherSourcesIncome)}</span>
                </div>
              </div>
            </div>

            {/* DEDUCTIONS & TOTAL INCOME COMPUTATION */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                DEDUCTIONS & TOTAL INCOME COMPUTATION
              </div>
              <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Gross Total Income (GTI):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.grossTotalIncome)}</span>
                </div>
                {data.regime === 'OLD' && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Less: Chapter VI-A Deductions:</span>
                    <span className="font-bold text-slate-900 dark:text-white">-{formatIndianCurrency(taxResult.deductions)}</span>
                  </div>
                )}
                {taxResult.roundingAdjustment !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Add/Less: Rounding off u/s 288A:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {taxResult.roundingAdjustment > 0 
                        ? `+${formatIndianCurrency(taxResult.roundingAdjustment)}` 
                        : formatIndianCurrency(taxResult.roundingAdjustment)
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold text-indigo-700 dark:text-indigo-400 text-xs">
                  <span>Total Income (Rounded u/s 288A):</span>
                  <span>{formatIndianCurrency(taxResult.totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* TAX CALCULATION & PAYMENT */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                TAX CALCULATION & PAYMENT ({data.regime} REGIME)
              </div>
              <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Tax Payable on Slabs:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.taxBeforeRebate)}</span>
                </div>
                
                {taxResult.rebate87A > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-500 font-semibold">
                    <span>Less: Rebate u/s 87A:</span>
                    <span>-{formatIndianCurrency(taxResult.rebate87A)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Add: Surcharge:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹0</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Add: Health & Education Cess @ 4%:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(taxResult.cess)}</span>
                </div>

                <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1.5">
                  <span>Gross Tax Liability:</span>
                  <span>{formatIndianCurrency(taxResult.totalTaxLiability)}</span>
                </div>

                {data.prepaid && (data.prepaid.tdsSalary > 0 || data.prepaid.tdsOthers > 0 || data.prepaid.tcsPaid > 0) && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium pl-4 pt-1">
                    <span>Less: TDS & TCS Credits:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">-{formatIndianCurrency((data.prepaid.tdsSalary || 0) + (data.prepaid.tdsOthers || 0) + (data.prepaid.tcsPaid || 0))}</span>
                  </div>
                )}
                {data.prepaid?.advanceTax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium pl-4">
                    <span>Less: Advance Tax Paid:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">-{formatIndianCurrency(data.prepaid.advanceTax)}</span>
                  </div>
                )}
                {data.prepaid?.selfAssessmentTax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium pl-4">
                    <span>Less: Self-Assessment Tax:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">-{formatIndianCurrency(data.prepaid.selfAssessmentTax)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-800 pt-2 mt-1 text-xs">
                  <span>Net Refund/Payable Due:</span>
                  <span className="text-indigo-700 dark:text-indigo-400">
                    {taxResult.refundAmount > 0 ? `REFUND DUE ${formatIndianCurrency(taxResult.refundAmount)}` : `TAX PAYABLE ${formatIndianCurrency(taxResult.payableAmount)}`}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Signature/Verification Footer */}
          <div className="mt-12 flex justify-between items-end text-[10px] text-slate-500 dark:text-slate-400 pt-8 border-t border-dashed border-slate-300 dark:border-slate-700">
            <div>
              <p>Place: <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{p.place || '-'}</span></p>
              <p className="mt-1">Date: <span className="font-bold text-slate-800 dark:text-slate-200">{formatStandardDate(p.dueDate)}</span></p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center text-center gap-1">
                <img src={qrCodeUrl} alt="ITR-4 QR Summary" className="w-16 h-16 border border-slate-200 dark:border-slate-700 p-0.5 rounded-lg bg-white" />
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Scan to Verify</span>
              </div>
            )}

            <div className="text-center w-48 border-t border-slate-300 dark:border-slate-700 pt-1.5">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{p.name || 'ASSESSEE'}</p>
              <p className="text-[8px] mt-0.5 uppercase tracking-wider">Signature of the Assessee</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}