import { ITR4Data } from '../types';
import { formatIndianCurrency, TaxResult } from './taxCalculator';
import QRCode from 'qrcode';

export async function exportToHtmlPdf(data: ITR4Data, taxResult: TaxResult) {
  const p = data.personal;
  const b = data.bank;
  const bus = data.business44AD;

  const clientName = p.name.trim().replace(/\s+/g, '_');
  const fyYear = (p.financialYear || '2025-26').trim().replace(/\//g, '-');
  const pdfTitle = `${clientName}_FY${fyYear}_Computation`;

  const isRefund = taxResult.refundAmount > 0;
  const isPayable = taxResult.payableAmount > 0;
  const refundOrPayableText = isPayable
    ? `+${formatIndianCurrency(taxResult.payableAmount)}`
    : isRefund
      ? `-${formatIndianCurrency(taxResult.refundAmount)}`
      : '₹0';

  const isSalaryActive = taxResult.salaryIncome > 0 || data.salary.grossSalary > 0;
  const isProfessionActive = data.profession44ADA.grossReceipts > 0;

  let qrCodeUrl = '';
  try {
    const refundOrPayable = taxResult.refundAmount > 0 
      ? `Refund Due: ${formatIndianCurrency(taxResult.refundAmount)}` 
      : `Tax Payable: ${formatIndianCurrency(taxResult.payableAmount)}`;

    const summaryText = `ITR-4 COMPUTATION
-------------------------
Name: ${p.name.toUpperCase()}
PAN: ${p.pan.toUpperCase()}
AY: ${p.assessmentYear} (FY: ${p.financialYear})
Regime: ${data.regime}
Total Income: ${formatIndianCurrency(taxResult.totalIncome)}
${refundOrPayable}`;

    qrCodeUrl = await QRCode.toDataURL(summaryText, {
      margin: 1,
      width: 90,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch (err) {
    console.error('Error generating offline QR code:', err);
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pdfTitle}</title>
  <style>
    /* Standardized Document Reset */
    html, body {
      font-family: "Arial", "Helvetica", sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .uppercase { text-transform: uppercase; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    
    /* Document Header */
    .header-block {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 5px 0;
      text-decoration: underline;
    }
    .header-sub {
      font-size: 12px;
      margin: 0;
    }

    /* Standardized Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 6px 8px;
      vertical-align: top;
    }
    th {
      background-color: #f2f2f2 !important; /* Extremely light grey for headers only */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      text-align: left;
    }
    
    /* Layout utilities */
    .amt-col {
      width: 120px;
      text-align: right;
    }
    .total-row td {
      font-weight: bold;
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      background-color: #f2f2f2 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 4px 8px;
      border: 1px solid #000000;
      border-bottom: none;
      margin: 0;
    }

    /* Print specific settings */
    @media print {
      @page {
        size: A4;
        margin: 15mm; /* This fixes the page 2 spacing issue */
      }
      .container {
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .print-bar {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
      }
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    /* Print Button UI (Hidden on actual PDF) */
    .print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f1f5f9;
      padding: 12px 20px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
      font-family: sans-serif;
    }
    .print-btn {
      background-color: #000000;
      color: white;
      padding: 8px 16px;
      font-weight: bold;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>📄 <strong>Computation Ready</strong> | Switch destination to "Save as PDF" in the print dialog.</span>
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="container">
    <div class="header-block">
      <h1 class="header-title">COMPUTATION OF TOTAL INCOME</h1>
      <p class="header-sub"><strong>ASSESSMENT YEAR:</strong> ${p.assessmentYear} &nbsp;|&nbsp; <strong>FINANCIAL YEAR:</strong> ${p.financialYear}</p>
    </div>

    <!-- Personal & Filing Details Table -->
    <table>
      <tr>
        <td width="20%"><strong>Name of Assessee:</strong></td>
        <td width="30%" class="uppercase"><strong>${p.name}</strong></td>
        <td width="20%"><strong>PAN:</strong></td>
        <td width="30%" class="uppercase"><strong>${p.pan}</strong></td>
      </tr>
      <tr>
        <td><strong>Father's Name:</strong></td>
        <td class="uppercase">${p.fatherName || '-'}</td>
        <td><strong>Date of Birth:</strong></td>
        <td>${p.dob || '-'}</td>
      </tr>
      <tr>
        <td><strong>Address:</strong></td>
        <td class="uppercase">${p.address || '-'}</td>
        <td><strong>Aadhaar No:</strong></td>
        <td>${p.aadhaar || '-'}</td>
      </tr>
      <tr>
        <td><strong>Tax Regime:</strong></td>
        <td class="uppercase">${data.regime}</td>
        <td><strong>Filing Section:</strong></td>
        <td>139(1) - On or before due date</td>
      </tr>
    </table>

    <div class="section-title">STATEMENT OF INCOME</div>
    <table style="border-top: none;">
      <tbody>
        <!-- Salary -->
        ${isSalaryActive ? `
        <tr>
          <td colspan="2"><strong>1. Income from Salary</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px;">Gross Salary Received</td>
          <td class="amt-col">${formatIndianCurrency(data.salary.grossSalary)}</td>
        </tr>
        <tr>
          <td style="padding-left: 20px;">Less: Standard Deduction u/s 16(ia)</td>
          <td class="amt-col">(${formatIndianCurrency(data.regime === 'NEW' ? 75000 : 50000)})</td>
        </tr>
        <tr>
          <td class="text-right"><strong>Net Income from Salary</strong></td>
          <td class="amt-col"><strong>${formatIndianCurrency(taxResult.salaryIncome)}</strong></td>
        </tr>
        ` : ''}

        <!-- Business & Profession -->
        <tr>
          <td colspan="2"><strong>2. Profits and Gains from Business or Profession (Presumptive)</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px;">Business Gross Turnover (Sec 44AD)</td>
          <td class="amt-col">${formatIndianCurrency(bus.turnoverBank + bus.turnoverCash)}</td>
        </tr>
        <tr>
          <td style="padding-left: 40px;">- Declared Business Profit (Sec 44AD)</td>
          <td class="amt-col">${formatIndianCurrency(bus.presumptiveIncomeTotal)}</td>
        </tr>
        ${data.business44AE && data.business44AE.presumptiveIncomeTotal > 0 ? `
        <tr>
          <td style="padding-left: 20px;">Presumptive Transport Profit (Sec 44AE - ${data.business44AE.vehicles?.length || 0} Carriages)</td>
          <td class="amt-col">${formatIndianCurrency(data.business44AE.presumptiveIncomeTotal)}</td>
        </tr>
        ` : ''}
        ${isProfessionActive ? `
        <tr>
          <td style="padding-left: 20px;">Professional Gross Receipts (Sec 44ADA)</td>
          <td class="amt-col">${formatIndianCurrency(data.profession44ADA.grossReceipts)}</td>
        </tr>
        <tr>
          <td style="padding-left: 40px;">- Declared Professional Profit (50%)</td>
          <td class="amt-col">${formatIndianCurrency(data.profession44ADA.presumptiveIncome)}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="text-right"><strong>Net Business & Profession Income</strong></td>
          <td class="amt-col"><strong>${formatIndianCurrency(taxResult.businessIncome + taxResult.professionIncome)}</strong></td>
        </tr>

        <!-- Other Sources -->
        <tr>
          <td colspan="2"><strong>3. Income from Other Sources</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px;">Savings Bank Interest</td>
          <td class="amt-col">${formatIndianCurrency(data.otherSources.interestSavings)}</td>
        </tr>
        <tr>
          <td style="padding-left: 20px;">Dividend / Other Interest</td>
          <td class="amt-col">${formatIndianCurrency(data.otherSources.dividendIncome + data.otherSources.interestOthers)}</td>
        </tr>
        <tr>
          <td class="text-right"><strong>Net Income from Other Sources</strong></td>
          <td class="amt-col"><strong>${formatIndianCurrency(taxResult.otherSourcesIncome)}</strong></td>
        </tr>
        
        <tr class="total-row">
          <td class="text-right">GROSS TOTAL INCOME</td>
          <td class="amt-col">${formatIndianCurrency(taxResult.grossTotalIncome)}</td>
        </tr>
        ${data.regime === 'OLD' ? `
        <tr>
          <td class="text-right">Less: Chapter VI-A Deductions</td>
          <td class="amt-col">-${formatIndianCurrency(taxResult.deductions)}</td>
        </tr>
        ` : ''}
        ${taxResult.roundingAdjustment !== 0 ? `
        <tr>
          <td class="text-right">Add/Less: Rounding off u/s 288A</td>
          <td class="amt-col">${taxResult.roundingAdjustment > 0 ? `+${formatIndianCurrency(taxResult.roundingAdjustment)}` : formatIndianCurrency(taxResult.roundingAdjustment)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td class="text-right">TOTAL TAXABLE INCOME (Rounded off u/s 288A)</td>
          <td class="amt-col">${formatIndianCurrency(taxResult.totalIncome)}</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">TAX COMPUTATION</div>
    <table style="border-top: none;">
      <tbody>
        <tr>
          <td>Tax on Total Income</td>
          <td class="amt-col">${formatIndianCurrency(taxResult.taxBeforeRebate)}</td>
        </tr>
        <tr>
          <td>Less: Rebate u/s 87A</td>
          <td class="amt-col">${taxResult.rebate87A > 0 ? `(${formatIndianCurrency(taxResult.rebate87A)})` : '0'}</td>
        </tr>
        <tr>
          <td>Add: Health & Education Cess @ 4%</td>
          <td class="amt-col">${formatIndianCurrency(taxResult.cess)}</td>
        </tr>
        <tr class="total-row">
          <td class="text-right">Gross Tax Liability</td>
          <td class="amt-col">${formatIndianCurrency(taxResult.totalTaxLiability)}</td>
        </tr>
        <tr>
          <td>Less: TDS / TCS / Advance Tax Paid</td>
          <td class="amt-col">(${formatIndianCurrency(taxResult.prepaidTax)})</td>
        </tr>
        <tr class="total-row">
          <td class="text-right">NET TAX ${isPayable ? 'PAYABLE' : 'REFUNDABLE'} (Rounded off u/s 288B)</td>
          <td class="amt-col">${refundOrPayableText}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="section-title">BANK ACCOUNT DETAILS (FOR REFUND)</div>
    <table style="border-top: none;">
      <tr>
        <td width="20%"><strong>Bank Name:</strong></td>
        <td width="30%" class="uppercase">${b.bankName}</td>
        <td width="20%"><strong>Account Number:</strong></td>
        <td width="30%">${b.accountNumber}</td>
      </tr>
      <tr>
        <td><strong>IFSC Code:</strong></td>
        <td class="uppercase">${b.ifsc}</td>
        <td><strong>Account Type:</strong></td>
        <td>Savings</td>
      </tr>
    </table>

    <table style="margin-top: 40px; border: none;">
      <tr style="border: none;">
        <td style="border: none; vertical-align: bottom;">
          <p><strong>Place:</strong> <span class="uppercase">${p.place || '-'}</span></p>
          <p><strong>Date:</strong> ${p.dueDate ? p.dueDate.split('-').reverse().join('-') : '31-08-2026'}</p>
        </td>
        ${qrCodeUrl ? `
        <td style="border: none; text-align: center; width: 150px;">
          <img src="${qrCodeUrl}" alt="QR" style="border: 1px solid #000; padding: 4px;" />
        </td>
        ` : ''}
        <td style="border: none; text-align: center; vertical-align: bottom; width: 250px;">
          <div style="border-bottom: 1px solid #000; width: 100%; margin-bottom: 5px; height: 40px;"></div>
          <strong>( ${p.name.toUpperCase()} )</strong><br/>
          Signature of Assessee
        </td>
      </tr>
    </table>
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

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${pdfTitle}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}