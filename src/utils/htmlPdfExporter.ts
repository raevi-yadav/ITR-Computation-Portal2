import { ITR4Data } from '../types';
import { formatIndianCurrency, TaxResult } from './taxCalculator';
import QRCode from 'qrcode';

export async function exportToHtmlPdf(data: ITR4Data, taxResult: TaxResult) {
  const p = data.personal;
  const b = data.bank;
  const bus = data.business44AD;

  const isRefund = taxResult.refundAmount > 0;
  const refundOrPayableText = isRefund
    ? `REFUND DUE: ${formatIndianCurrency(taxResult.refundAmount)}`
    : `TAX PAYABLE: ${formatIndianCurrency(taxResult.payableAmount)}`;

  const isSalaryActive = taxResult.salaryIncome > 0 || data.salary.grossSalary > 0;
  const isProfessionActive = data.profession44ADA.grossReceipts > 0;

  let qrCodeUrl = '';
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

    qrCodeUrl = await QRCode.toDataURL(summaryText, {
      margin: 1,
      width: 120,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating offline QR code:', err);
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax_Computation_${p.name.replace(/\s+/g, '_')}_AY_${p.assessmentYear || '2026-27'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      color-scheme: light;
      margin: 40px auto;
      max-width: 800px;
      padding: 20px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-widest { letter-spacing: 0.1em; }
    
    .header-block {
      text-align: center;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: 0.05em;
    }
    .header-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      margin: 6px 0 0 0;
      letter-spacing: 0.1em;
    }
    
    /* Details block */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background-color: #e2e8f0;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      font-size: 11px;
    }
    .details-box {
      background-color: #ffffff;
      padding: 14px;
    }
    .details-title {
      font-weight: 800;
      color: #4338ca;
      font-size: 9px;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .grid-row {
      display: flex;
      margin-bottom: 4px;
    }
    .lbl {
      color: #94a3b8;
      font-weight: 700;
      width: 32%;
    }
    .val {
      color: #334155;
      font-weight: 700;
      width: 68%;
    }
    
    /* Summary blocks */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      text-align: center;
      background-color: #f8fafc;
    }
    .summary-label {
      font-size: 8px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .summary-val {
      font-size: 14px;
      font-weight: 900;
      margin-top: 4px;
    }
    .summary-val.indigo { color: #4f46e5; }
    .summary-val.slate { color: #0f172a; }
    .summary-val.emerald { color: #059669; }
    .summary-val.rose { color: #dc2626; }
    
    /* Tables */
    .comp-section {
      margin-bottom: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      font-size: 11px;
    }
    .comp-header {
      background-color: #f8fafc;
      padding: 8px 14px;
      font-weight: 700;
      color: #334155;
      border-bottom: 1px solid #cbd5e1;
      font-size: 9px;
      letter-spacing: 0.05em;
    }
    .comp-body {
      padding: 12px 14px;
    }
    .comp-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .comp-row.sub-row {
      padding-left: 16px;
      color: #64748b;
    }
    .comp-row.total-row {
      border-top: 1px solid #f1f5f9;
      margin-top: 4px;
      padding-top: 6px;
      font-weight: 700;
      color: #0f172a;
    }
    .comp-row.final-row {
      border-top: 2px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 6px;
      font-weight: 900;
      font-size: 12px;
    }
    .text-emerald { color: #059669; }
    .text-indigo { color: #4f46e5; }
    .text-rose { color: #dc2626; }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #64748b;
      border-top: 1px dashed #cbd5e1;
      padding-top: 24px;
    }
    .sig-line {
      width: 180px;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      text-align: center;
    }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }
    .qr-img {
      width: 64px;
      height: 64px;
      border: 1px solid #cbd5e1;
      padding: 2px;
      border-radius: 6px;
      background-color: #ffffff;
    }
    .qr-lbl {
      font-size: 7px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    
    @media print {
      html, body {
        background-color: #ffffff !important;
        background: #ffffff !important;
        color-scheme: light !important;
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .print-bar {
        display: none !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }
    
    /* Offline Print Bar */
    .print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f1f5f9;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .print-info-text {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
    }
    .print-btn {
      background-color: #4f46e5;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.15);
    }
    .print-btn:hover {
      background-color: #4338ca;
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="print-info-text">📄 <strong>Ready to print or save!</strong> This offline file opens standard PDF capabilities directly.</span>
    <button class="print-btn" onclick="window.print()">Save PDF</button>
  </div>

  <div class="header-block">
    <h1 class="header-title">COMPUTATION OF TOTAL INCOME</h1>
    <p class="header-sub">ITR-4 | ASSESSMENT YEAR ${p.assessmentYear} | FINANCIAL YEAR ${p.financialYear}</p>
  </div>

  <div class="details-grid">
    <!-- Assessee details -->
    <div class="details-box">
      <div class="details-title">ASSESSEE DETAILS</div>
      <div class="grid-row"><span class="lbl">Name:</span><span class="val uppercase">${p.name}</span></div>
      <div class="grid-row"><span class="lbl">PAN:</span><span class="val uppercase">${p.pan}</span></div>
      <div class="grid-row"><span class="lbl">DOB:</span><span class="val">${p.dob}</span></div>
      <div class="grid-row"><span class="lbl">Aadhaar:</span><span class="val">${p.aadhaar}</span></div>
      <div class="grid-row"><span class="lbl">Mobile:</span><span class="val">${p.mobile}</span></div>
    </div>
    
    <!-- Address & Filing -->
    <div class="details-box">
      <div class="details-title">ADDRESS & FILING</div>
      <div class="grid-row"><span class="lbl">Address:</span><span class="val uppercase">${p.address}</span></div>
      <div class="grid-row"><span class="lbl">Email:</span><span class="val">${p.email}</span></div>
      <div class="grid-row"><span class="lbl">Filed u/s:</span><span class="val">Section ${p.filingSection || '11'}</span></div>
      <div class="grid-row"><span class="lbl">Due Date:</span><span class="val">${p.dueDate}</span></div>
    </div>

    <!-- Bank details -->
    <div class="details-box">
      <div class="details-title">BANK FOR REFUND</div>
      <div class="grid-row"><span class="lbl">Bank Name:</span><span class="val uppercase">${b.bankName}</span></div>
      <div class="grid-row"><span class="lbl">IFSC:</span><span class="val uppercase">${b.ifsc}</span></div>
      <div class="grid-row"><span class="lbl">A/c No:</span><span class="val">${b.accountNumber}</span></div>
    </div>

    <!-- Verification -->
    <div class="details-box">
      <div class="details-title">VERIFICATION</div>
      <div class="grid-row"><span class="lbl">Verified By:</span><span class="val uppercase">${p.name}</span></div>
      <div class="grid-row"><span class="lbl">Father Name:</span><span class="val uppercase">${p.fatherName}</span></div>
      <div class="grid-row"><span class="lbl">Place:</span><span class="val uppercase">${p.place}</span></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <span class="summary-label">GROSS TOTAL INCOME</span>
      <div class="summary-val indigo">${formatIndianCurrency(taxResult.grossTotalIncome)}</div>
    </div>
    <div class="summary-card">
      <span class="summary-label">TOTAL INCOME</span>
      <div class="summary-val slate">${formatIndianCurrency(taxResult.totalIncome)}</div>
    </div>
    <div class="summary-card">
      <span class="summary-label">REFUND / PAYABLE</span>
      <div class="summary-val ${isRefund ? 'emerald' : 'rose'}">${refundOrPayableText}</div>
    </div>
  </div>

  <!-- Detailed Sections -->
  <div class="page-break"></div>
  ${isSalaryActive ? `
  <div class="comp-section">
    <div class="comp-header">SALARY INCOME COMPUTATION</div>
    <div class="comp-body">
      <div class="comp-row"><span>Gross Salary</span><span class="font-bold">${formatIndianCurrency(data.salary.grossSalary)}</span></div>
      <div class="comp-row sub-row"><span>Less: Standard Deduction u/s 16(ia)</span><span>-${formatIndianCurrency(data.regime === 'NEW' ? 75000 : 50000)}</span></div>
      <div class="comp-row total-row"><span>Income from Salary</span><span>${formatIndianCurrency(taxResult.salaryIncome)}</span></div>
    </div>
  </div>
  ` : ''}

  <div class="comp-section">
    <div class="comp-header">BUSINESS / PROFESSION COMPUTATION (PRESUMPTIVE)</div>
    <div class="comp-body">
      <div class="comp-row"><span>Section 44AD Gross Turnover</span><span class="font-bold">${formatIndianCurrency(bus.turnoverBank + bus.turnoverCash)}</span></div>
      <div class="comp-row sub-row"><span>- Bank / Digital Receipts Mode</span><span>${formatIndianCurrency(bus.turnoverBank)}</span></div>
      <div class="comp-row sub-row"><span>- Cash / Other Receipts Mode</span><span>${formatIndianCurrency(bus.turnoverCash)}</span></div>
      <div class="comp-row total-row"><span>44AD Presumptive Business Income</span><span>${formatIndianCurrency(bus.presumptiveIncomeTotal)}</span></div>
      
      ${isProfessionActive ? `
      <div class="comp-row" style="margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 10px;"><span>Section 44ADA Professional Gross Receipts</span><span class="font-bold">${formatIndianCurrency(data.profession44ADA.grossReceipts)}</span></div>
      <div class="comp-row total-row"><span>44ADA Presumptive Professional Income</span><span>${formatIndianCurrency(data.profession44ADA.presumptiveIncome)}</span></div>
      ` : ''}
    </div>
  </div>

  <div class="comp-section">
    <div class="comp-header">OTHER SOURCES DETAILS</div>
    <div class="comp-body">
      <div class="comp-row"><span>Savings Bank Interest</span><span>${formatIndianCurrency(data.otherSources.interestSavings)}</span></div>
      <div class="comp-row"><span>Other Incomes / Interest</span><span>${formatIndianCurrency(data.otherSources.interestOthers)}</span></div>
      <div class="comp-row"><span>Dividend Income</span><span>${formatIndianCurrency(data.otherSources.dividendIncome)}</span></div>
      <div class="comp-row total-row"><span>Total Income from Other Sources</span><span>${formatIndianCurrency(taxResult.otherSourcesIncome)}</span></div>
    </div>
  </div>

  <div class="comp-section">
    <div class="comp-header">TAX COMPUTATION & LIABILITY (${data.regime} REGIME)</div>
    <div class="comp-body">
      <div class="comp-row"><span>Total Tax computed on Income Slabs</span><span>${formatIndianCurrency(taxResult.taxBeforeRebate)}</span></div>
      ${taxResult.rebate87A > 0 ? `<div class="comp-row text-emerald"><span>Less: Rebate u/s 87A</span><span>-${formatIndianCurrency(taxResult.rebate87A)}</span></div>` : ''}
      <div class="comp-row"><span>Add: Health & Education Cess @ 4%</span><span>${formatIndianCurrency(taxResult.cess)}</span></div>
      <div class="comp-row total-row"><span>Total Tax Liability</span><span>${formatIndianCurrency(taxResult.totalTaxLiability)}</span></div>
      <div class="comp-row text-emerald" style="font-weight: 700;"><span>Less: Total TDS/TCS & Prepaid Taxes</span><span>-${formatIndianCurrency(taxResult.prepaidTax)}</span></div>
      <div class="comp-row final-row">
        <span>Net Refund / Tax Payable Status</span>
        <span class="${isRefund ? 'text-emerald' : 'text-rose'}">${refundOrPayableText}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>
      <p>Place: <strong class="uppercase" style="color: #334155;">${p.place}</strong></p>
      <p style="margin-top: 4px;">Date: <strong style="color: #334155;">${p.dueDate ? p.dueDate.split('-').reverse().join('-') : '31-08-2026'}</strong></p>
    </div>
    
    ${qrCodeUrl ? `
    <div class="qr-container">
      <img class="qr-img" src="${qrCodeUrl}" alt="ITR-4 QR Summary" />
      <span class="qr-lbl">Scan to Verify</span>
    </div>
    ` : ''}

    <div class="sig-line">
      <p class="uppercase" style="color: #0f172a; font-weight: 700; margin: 0;">${p.name}</p>
      <p style="margin-top: 2px; font-size: 8px;">Signature of the Assessee</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  // Create downloadable blob
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `ITR-4_Tax_Computation_${p.name.replace(/\s+/g, '_')}_AY_${p.assessmentYear || '2026-27'}.html`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
