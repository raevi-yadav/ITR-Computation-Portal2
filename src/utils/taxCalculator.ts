import { ITR4Data } from '../types';

export const SAMPLE_DATA: ITR4Data = {
  personal: {
    name: 'DEMO CLIENT',
    pan: 'ABCDE1234F',
    dob: '1981-03-07',
    aadhaar: '999999999999',
    mobile: '9876543210',
    email: 'demo.client@example.com',
    address: '101, SAMPLE TOWER, MAIN ROAD, DEMO AREA, LUCKNOW, State 09, 226001',
    street: '101, SAMPLE TOWER, MAIN ROAD',
    area: 'DEMO AREA',
    city: 'LUCKNOW',
    state: 'Uttar Pradesh (State 09)',
    pinCode: '226001',
    filingSection: '11', // 139(1) - On or before due date
    dueDate: '2026-08-31',
    assessmentYear: '2026-27',
    financialYear: '2025-26',
    fatherName: 'DEMO FATHER',
    place: 'LUCKNOW'
  },
  bank: {
    bankName: 'STATE BANK OF INDIA',
    ifsc: 'SBIN0000001',
    accountNumber: '1234567890'
  },
  salary: {
    grossSalary: 450000,
    standardDeduction: 75000,
    netSalary: 375000
  },
  houseProperty: {
    grossRent: 0,
    taxesPaid: 0,
    annualValue: 0,
    interestOnBorrowing: 0,
    netHPIncome: 0
  },
  business44AD: {
    turnoverBank: 1945874,
    turnoverCash: 0,
    presumptiveIncomeBank: 116752, // 6% of 19,45,874
    presumptiveIncomeCash: 0,
    presumptiveIncomeTotal: 700000, // User entered professional presumptive profit
    cashInHand: 40000,
    totalAssets: 40000,
    sundryDebtors: 0,
    sundryCreditors: 0,
    closingStock: 77835,
    openingStock: 46701,
    purchases: 1131068,
    freight: 29188,
    capital: 0,
    otherLiabilities: 0,
    bankBalance: 0,
    fixedAssets: 0
  },
  profession44ADA: {
    grossReceipts: 0,
    presumptiveIncome: 0
  },
  otherSources: {
    interestSavings: 927,
    interestOthers: 7000,
    dividendIncome: 0,
    otherIncome: 0,
    totalOtherSources: 7927
  },
  deductions: {
    sec80C: 0,
    sec80D: 0,
    sec80G: 0,
    sec80TTA: 0,
    totalDeductions: 0
  },
  prepaid: {
    tdsSalary: 60000,
    tdsOthers: 10438,
    tcsPaid: 0,
    advanceTax: 0,
    selfAssessmentTax: 0,
    totalTDS: 70438,
    totalPrepaid: 70438
  },
  regime: 'NEW'
};

export interface TaxResult {
  salaryIncome: number;
  hpIncome: number;
  businessIncome: number;
  professionIncome: number;
  otherSourcesIncome: number;
  grossTotalIncome: number;
  deductions: number;
  totalIncome: number; // Rounded u/s 288A
  taxBeforeRebate: number;
  rebate87A: number;
  taxAfterRebate: number;
  cess: number;
  totalTaxLiability: number;
  prepaidTax: number;
  refundAmount: number;
  payableAmount: number;
  slabs: { rate: number; min: number; max: number; tax: number }[];
}

export function formatIndianCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format as Indian system: eg: 10,82,927
  const x = absAmount.toString();
  let lastThree = x.substring(x.length - 3);
  const otherNumbers = x.substring(0, x.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return (isNegative ? '-' : '') + '₹' + res;
}

export function roundToNearestTen(amount: number): number {
  return Math.round(amount / 10) * 10;
}

export function calculateTax(data: ITR4Data): TaxResult {
  // 1. Head 1: Salary
  const standardDeduction = data.regime === 'NEW' ? 75000 : 50000;
  const netSalary = Math.max(0, data.salary.grossSalary - standardDeduction);

  // 2. Head 2: House Property
  const hpAnnualValue = Math.max(0, data.houseProperty.grossRent - data.houseProperty.taxesPaid);
  const hpStandardDeduction = hpAnnualValue * 0.3; // 30% standard deduction
  // For self-occupied, rent is 0, interest on borrowing can be negative (up to 2L in Old, 0 or capped in New depending on section)
  let netHPIncome = 0;
  if (data.houseProperty.grossRent > 0) {
    netHPIncome = hpAnnualValue - hpStandardDeduction - data.houseProperty.interestOnBorrowing;
  } else {
    // If self occupied home loan interest
    netHPIncome = -data.houseProperty.interestOnBorrowing;
  }

  // 3. Head 3: Business Income (44AD / 44AE)
  // 44AD presumptive minimums: 6% on digital, 8% on cash. But taxpayer can declare higher.
  const min44ADDigital = data.business44AD.turnoverBank * 0.06;
  const min44ADCash = data.business44AD.turnoverCash * 0.08;
  const presumptiveCalculated = min44ADDigital + min44ADCash;
  // Use presumptive profit declared, which should be >= presumptive calculated
  const businessIncome = Math.max(presumptiveCalculated, data.business44AD.presumptiveIncomeTotal);

  // 4. Head 4: Profession Income (44ADA)
  // 44ADA presumptive: 50% of receipts
  const professionIncome = Math.max(data.profession44ADA.grossReceipts * 0.5, data.profession44ADA.presumptiveIncome);

  // 5. Head 5: Other Sources
  const otherSourcesIncome = data.otherSources.interestSavings + 
                             data.otherSources.interestOthers + 
                             data.otherSources.dividendIncome + 
                             data.otherSources.otherIncome;

  // Gross Total Income
  const grossTotalIncome = netSalary + netHPIncome + businessIncome + professionIncome + otherSourcesIncome;

  // Deductions (Chapter VI-A)
  let deductions = 0;
  if (data.regime === 'OLD') {
    // Under Old Regime, 80C (up to 1.5L), 80D, 80TTA (interest savings up to 10k)
    const d80C = Math.min(150000, data.deductions.sec80C);
    const d80D = data.deductions.sec80D;
    const d80G = data.deductions.sec80G;
    // 80TTA: Savings interest up to 10k
    const max80TTA = Math.min(10000, data.otherSources.interestSavings, data.deductions.sec80TTA || 10000);
    deductions = d80C + d80D + d80G + max80TTA;
  } else {
    // Under New Regime, standard deductions from salary are allowed (already deducted), but Chapter VI-A deductions are generally NOT allowed (except 80CCD(2), which is not typical here).
    deductions = 0;
  }

  // Net Taxable Income
  const totalIncomeRaw = Math.max(0, grossTotalIncome - deductions);
  const totalIncome = roundToNearestTen(totalIncomeRaw);

  // Tax Calculation Slabs
  let taxBeforeRebate = 0;
  const slabs: { rate: number; min: number; max: number; tax: number }[] = [];

  if (data.regime === 'NEW') {
    // Slabs for FY 2025-26 (AY 2026-27):
    // 0 to 3L: Nil
    // 3L to 7L: 5% (max 20k)
    // 7L to 10L: 10% (max 30k)
    // 10L to 12L: 15% (max 30k)
    // 12L to 15L: 20% (max 60k)
    // Above 15L: 30%
    const newSlabs = [
      { rate: 0, min: 0, max: 300000 },
      { rate: 5, min: 300000, max: 700000 },
      { rate: 10, min: 700000, max: 1000000 },
      { rate: 15, min: 1000000, max: 1200000 },
      { rate: 20, min: 1200000, max: 1500000 },
      { rate: 30, min: 1500000, max: Infinity }
    ];

    for (const slab of newSlabs) {
      if (totalIncome > slab.min) {
        const taxableInSlab = Math.min(totalIncome - slab.min, slab.max - slab.min);
        const slabTax = (taxableInSlab * slab.rate) / 100;
        taxBeforeRebate += slabTax;
        slabs.push({ rate: slab.rate, min: slab.min, max: slab.max, tax: slabTax });
      } else {
        slabs.push({ rate: slab.rate, min: slab.min, max: slab.max, tax: 0 });
      }
    }
  } else {
    // Old Regime Slabs:
    // 0 to 2.5L: Nil
    // 2.5L to 5L: 5% (max 12.5k)
    // 5L to 10L: 20% (max 1L)
    // Above 10L: 30%
    const oldSlabs = [
      { rate: 0, min: 0, max: 250000 },
      { rate: 5, min: 250000, max: 500000 },
      { rate: 20, min: 500000, max: 1000000 },
      { rate: 30, min: 1000000, max: Infinity }
    ];

    for (const slab of oldSlabs) {
      if (totalIncome > slab.min) {
        const taxableInSlab = Math.min(totalIncome - slab.min, slab.max - slab.min);
        const slabTax = (taxableInSlab * slab.rate) / 100;
        taxBeforeRebate += slabTax;
        slabs.push({ rate: slab.rate, min: slab.min, max: slab.max, tax: slabTax });
      } else {
        slabs.push({ rate: slab.rate, min: slab.min, max: slab.max, tax: 0 });
      }
    }
  }

  // 87A Rebate
  let rebate87A = 0;
  if (data.regime === 'NEW') {
    // Under New Regime, if total income is <= 7,00,000, rebate is 100% of tax (up to 20k)
    if (totalIncome <= 700000) {
      rebate87A = taxBeforeRebate;
    } else if (totalIncome > 700000 && totalIncome <= 727770) {
      // Marginal relief u/s 87A in New Regime:
      // Tax cannot exceed the amount by which income exceeds 7 Lakh.
      const incomeExceeding7L = totalIncome - 700000;
      if (taxBeforeRebate > incomeExceeding7L) {
        rebate87A = taxBeforeRebate - incomeExceeding7L;
      }
    }
  } else {
    // Under Old Regime, if total income is <= 5,00,000, rebate is 100% of tax (up to 12.5k)
    if (totalIncome <= 500000) {
      rebate87A = taxBeforeRebate;
    }
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

  // Cess @ 4%
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTaxLiability = taxAfterRebate + cess;

  // Prepaid Taxes
  const prepaidTax = data.prepaid.tdsSalary + 
                     data.prepaid.tdsOthers + 
                     data.prepaid.tcsPaid + 
                     data.prepaid.advanceTax + 
                     data.prepaid.selfAssessmentTax;

  // Refund / Payable
  let refundAmount = 0;
  let payableAmount = 0;

  if (prepaidTax > totalTaxLiability) {
    refundAmount = prepaidTax - totalTaxLiability;
  } else {
    payableAmount = totalTaxLiability - prepaidTax;
  }

  return {
    salaryIncome: netSalary,
    hpIncome: netHPIncome,
    businessIncome,
    professionIncome,
    otherSourcesIncome,
    grossTotalIncome,
    deductions,
    totalIncome,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    cess,
    totalTaxLiability,
    prepaidTax,
    refundAmount,
    payableAmount,
    slabs
  };
}
