import React from 'react';
import { ITR4Data } from '../types';
import { formatIndianCurrency, calculateTax, TaxResult } from '../utils/taxCalculator';
import { Printer, Download, ExternalLink, Info } from 'lucide-react';
import { exportToHtmlPdf } from '../utils/htmlPdfExporter';
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

  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generateQrCode = async () => {
      try {
        const refundOrPayable = taxResult.refundAmount > 0 
          ? `Refund Due: ${formatIndianCurrency(taxResult.refundAmount)}` 
          : `Tax Payable: ${formatIndianCurrency(taxResult.payableAmount)}`;

        const summaryText = `ITR-4 COMPUTATION SUMMARY
-------------------------
Name: ${p.name.toUpperCase()}
PAN: ${p.pan.toUpperCase()}
AY: ${p.assessmentYear} (FY: ${p.financialYear})
Regime: ${data.regime}
Gross Total Income: ${formatIndianCurrency(taxResult.grossTotalIncome)}
Total Taxable Income: ${formatIndianCurrency(taxResult.totalIncome)}
${refundOrPayable}
Bank Name: ${b.bankName.toUpperCase()}
Account No: ${b.accountNumber}
Filing Section: Section ${p.filingSection || '139(1)'}
Verified via Portal QR Acknowledgement`;

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
  }, [p, b, taxResult, data.regime]);

  return (
    <div id="computation-pdf-container" className="space-y-6">
      {/* Visual Header in UI (Hidden in printing) */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Professional Computation Report
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Standard format for tax computations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={async () => {
              try {
                await exportToHtmlPdf(data, taxResult);
              } catch (err) {
                console.error('Error downloading print-ready file:', err);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
            title="Download offline HTML that automatically triggers the browser print dialog"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Download Print-Ready File
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-md hover:shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5" />
            Save PDF
          </button>
        </div>
      </div>

      {/* Iframe Sandboxing Information Banner */}
      {isEmbedded && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 print:hidden">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1.5 leading-relaxed">
            <p className="font-bold">Important Note on PDF Saving inside the Sandbox Editor</p>
            <p>
              Browsers block print commands from inside embedded preview frames. To save this document as a PDF, you have two options:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-medium text-amber-800">
              <li>
                Click <strong className="text-amber-950">"Download Print-Ready File"</strong> above. Opening this single downloaded file on your computer opens a clean window which immediately fires the standard print/PDF save prompt.
              </li>
              <li>
                Or, click the <strong className="text-amber-950">"Open App in New Tab"</strong> button (arrow icon in the top-right corner of the preview frame), and click <strong className="text-amber-950">"Save PDF"</strong> there.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Styled A4 sheet mockup for screen display - which turns into perfect direct page in print */}
      <div 
        id="printable-computation-document"
        className="mx-auto w-full max-w-[800px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm relative print:shadow-none print:border-none print:p-0 print:max-w-none"
      >
        {/* Document Frame styling */}
        <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl print:border-none print:p-0">
          
          {/* Main Document Header Block */}
          <div className="text-center space-y-2 border-b-2 border-indigo-600 pb-5">
            <h2 className="text-2xl font-black tracking-wider text-slate-900 dark:text-white uppercase">
              COMPUTATION OF TOTAL INCOME
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
              ITR-4 | Assessment Year {p.assessmentYear} | Financial Year {p.financialYear}
            </p>
          </div>

          {/* 4 Quadrants Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-6 text-[11px] leading-relaxed">
            
            {/* ASSESSEE DETAILS */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-1.5">
              <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                ASSESSEE DETAILS
              </h4>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Name:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200 uppercase">{p.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">PAN:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">{p.pan}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">DOB:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300">{p.dob}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Aadhaar:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300">{p.aadhaar}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Mobile:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300">{p.mobile}</span>
              </div>
            </div>

            {/* ADDRESS & FILING */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-1.5">
              <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                ADDRESS & FILING
              </h4>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Address:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300 line-clamp-2 uppercase leading-normal">{p.address}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Email:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300 truncate">{p.email}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Filed u/s:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200">Section {p.filingSection || '11'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Due Date:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300">{p.dueDate}</span>
              </div>
            </div>

            {/* BANK FOR REFUND */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-1.5">
              <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                BANK FOR REFUND
              </h4>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Bank:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200 uppercase">{b.bankName}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">IFSC:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">{b.ifsc}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">A/c No:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200 tracking-wide">{b.accountNumber}</span>
              </div>
            </div>

            {/* VERIFICATION */}
            <div className="bg-white dark:bg-slate-950 p-4 space-y-1.5">
              <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                VERIFICATION
              </h4>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Name:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300 uppercase">{p.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Father:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300 uppercase">{p.fatherName}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold">Place:</span>
                <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300 uppercase">{p.place}</span>
              </div>
            </div>
          </div>

          {/* Three Summary Cards (Identical layout to Screen 10) */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">GROSS TOTAL INCOME</span>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">{formatIndianCurrency(taxResult.grossTotalIncome)}</p>
            </div>
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">TOTAL INCOME</span>
              <p className="text-sm font-black text-slate-950 dark:text-white mt-1">{formatIndianCurrency(taxResult.totalIncome)}</p>
            </div>
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">REFUND / PAYABLE</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {taxResult.refundAmount > 0 ? `REFUND ${formatIndianCurrency(taxResult.refundAmount)}` : `PAYABLE ${formatIndianCurrency(taxResult.payableAmount)}`}
              </p>
            </div>
          </div>

          {/* Detailed Calculations (Screen 9 details list) */}
          <div className="mt-6 space-y-5 text-[11px] leading-relaxed print:print-page-break-before print:mt-4">
            
            {/* SALARY COMPUTATION (if salary gross > 0) */}
            {(taxResult.salaryIncome > 0 || data.salary.grossSalary > 0) && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  SALARY INCOME COMPUTATION
                </div>
                <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Gross Salary:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(data.salary.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 pl-4 font-medium">Less: Standard Deduction u/s 16(ia):</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">-{formatIndianCurrency(data.regime === 'NEW' ? 75000 : 50000)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-1.5 font-bold text-slate-900 dark:text-white">
                    <span>Income from Salary:</span>
                    <span>{formatIndianCurrency(taxResult.salaryIncome)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS / PROFESSION COMPUTATION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                BUSINESS / PROFESSION COMPUTATION
              </div>
              <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">44AD Gross Turnover:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatIndianCurrency(bus.turnoverBank + bus.turnoverCash)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Bank/Digital Turnover:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(bus.turnoverBank)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Cash/Other Turnover:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(bus.turnoverCash)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">44AD Declared Presumptive Income:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(bus.presumptiveIncomeTotal)}</span>
                </div>
                
                {data.profession44ADA.grossReceipts > 0 && (
                  <>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">44ADA Gross Receipts:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{formatIndianCurrency(data.profession44ADA.grossReceipts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">44ADA Declared Presumptive Income:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatIndianCurrency(data.profession44ADA.presumptiveIncome)}</span>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Cash in Hand:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(bus.cashInHand)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Total Assets:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(bus.totalAssets)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER SOURCES DETAILS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                OTHER SOURCES DETAILS
              </div>
              <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Savings Bank Interest (SAV):</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(data.otherSources.interestSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Other Interest/Incomes (OTH):</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(data.otherSources.interestOthers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Dividend Income (DIV):</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(data.otherSources.dividendIncome)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold text-gray-900 dark:text-white">
                  <span>Total Other Sources Income:</span>
                  <span>{formatIndianCurrency(taxResult.otherSourcesIncome)}</span>
                </div>
              </div>
            </div>

            {/* TAX CALCULATION & PAYMENT */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                TAX CALCULATION & PAYMENT ({data.regime} REGIME)
              </div>
              <div className="p-4 space-y-1.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tax Payable on Slabs:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(taxResult.taxBeforeRebate)}</span>
                </div>
                {taxResult.rebate87A > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Less: Rebate u/s 87A:</span>
                    <span>-{formatIndianCurrency(taxResult.rebate87A)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Add: Health & Education Cess @ 4%:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatIndianCurrency(taxResult.cess)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <span>Total Tax Liability:</span>
                  <span>{formatIndianCurrency(taxResult.totalTaxLiability)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Less: Total TDS/TCS & Prepaid Taxes:</span>
                  <span>-{formatIndianCurrency(taxResult.prepaidTax)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-850 pt-1.5 text-xs">
                  <span>Net Refund/Payable Due:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {taxResult.refundAmount > 0 ? `REFUND DUE ${formatIndianCurrency(taxResult.refundAmount)}` : `TAX PAYABLE ${formatIndianCurrency(taxResult.payableAmount)}`}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Signature/Verification Footer */}
          <div className="mt-12 flex justify-between items-end text-[10px] text-gray-500 dark:text-slate-400 pt-8 border-t border-dashed border-gray-200 dark:border-slate-800">
            <div>
              <p>Place: <span className="font-bold text-gray-800 dark:text-slate-200 uppercase">{p.place}</span></p>
              <p className="mt-1">Date: <span className="font-bold text-gray-800 dark:text-slate-200">{p.dueDate ? p.dueDate.split('-').reverse().join('-') : '31-08-2026'}</span></p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center text-center gap-1">
                <img src={qrCodeUrl} alt="ITR-4 QR Summary" className="w-16 h-16 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg bg-white" />
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Scan to Verify</span>
              </div>
            )}

            <div className="text-center w-48 border-t border-gray-300 dark:border-slate-700 pt-1">
              <p className="font-bold text-gray-800 dark:text-slate-200 uppercase">{p.name}</p>
              <p className="text-[8px] mt-0.5">Signature of the Assessee</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
