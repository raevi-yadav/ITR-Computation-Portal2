export interface PersonalDetails {
  name: string;
  pan: string;
  dob: string;
  aadhaar: string;
  mobile: string;
  email: string;
  address: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  filingSection: string; // e.g., "11 (139(1))"
  dueDate: string;
  assessmentYear: string;
  financialYear: string;
  fatherName: string;
  place: string;
}

export interface BankDetails {
  bankName: string;
  ifsc: string;
  accountNumber: string;
}

export interface SalaryIncome {
  grossSalary: number;
  standardDeduction: number;
  netSalary: number;
}

export interface HousePropertyIncome {
  grossRent: number;
  taxesPaid: number;
  annualValue: number;
  interestOnBorrowing: number;
  netHPIncome: number;
}

export interface PresumptiveBusiness {
  turnoverBank: number;
  turnoverCash: number;
  presumptiveIncomeBank: number; // 6%
  presumptiveIncomeCash: number; // 8%
  presumptiveIncomeTotal: number;
  cashInHand: number;
  totalAssets: number;
  sundryDebtors: number;
  sundryCreditors: number;
  closingStock: number;
  openingStock: number;
  purchases: number;
  freight: number;
  capital: number;
  otherLiabilities: number;
  bankBalance: number;
  fixedAssets: number;
}

export interface PresumptiveProfession {
  grossReceipts: number;
  presumptiveIncome: number; // 50%
}

export interface OtherSourcesIncome {
  interestSavings: number;
  interestOthers: number;
  dividendIncome: number;
  otherIncome: number;
  totalOtherSources: number;
}

export interface TaxDeductions {
  sec80C: number;
  sec80D: number;
  sec80G: number;
  sec80TTA: number;
  totalDeductions: number;
}

export interface PrepaidTax {
  tdsSalary: number;
  tdsOthers: number;
  tcsPaid: number;
  advanceTax: number;
  selfAssessmentTax: number;
  totalTDS: number;
  totalPrepaid: number;
}

export interface ITR4Data {
  personal: PersonalDetails;
  bank: BankDetails;
  salary: SalaryIncome;
  houseProperty: HousePropertyIncome;
  business44AD: PresumptiveBusiness;
  profession44ADA: PresumptiveProfession;
  otherSources: OtherSourcesIncome;
  deductions: TaxDeductions;
  prepaid: PrepaidTax;
  regime: 'OLD' | 'NEW';
}

export function createBlankData(): ITR4Data {
  return {
    personal: {
      name: '',
      pan: '',
      dob: '',
      aadhaar: '',
      mobile: '',
      email: '',
      address: '',
      street: '',
      area: '',
      city: '',
      state: '',
      pinCode: '',
      filingSection: '',
      dueDate: '',
      assessmentYear: '',
      financialYear: '',
      fatherName: '',
      place: ''
    },
    bank: {
      bankName: '',
      ifsc: '',
      accountNumber: ''
    },
    salary: {
      grossSalary: 0,
      standardDeduction: 0,
      netSalary: 0
    },
    houseProperty: {
      grossRent: 0,
      taxesPaid: 0,
      annualValue: 0,
      interestOnBorrowing: 0,
      netHPIncome: 0
    },
    business44AD: {
      turnoverBank: 0,
      turnoverCash: 0,
      presumptiveIncomeBank: 0,
      presumptiveIncomeCash: 0,
      presumptiveIncomeTotal: 0,
      cashInHand: 0,
      totalAssets: 0,
      sundryDebtors: 0,
      sundryCreditors: 0,
      closingStock: 0,
      openingStock: 0,
      purchases: 0,
      freight: 0,
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
      interestSavings: 0,
      interestOthers: 0,
      dividendIncome: 0,
      otherIncome: 0,
      totalOtherSources: 0
    },
    deductions: {
      sec80C: 0,
      sec80D: 0,
      sec80G: 0,
      sec80TTA: 0,
      totalDeductions: 0
    },
    prepaid: {
      tdsSalary: 0,
      tdsOthers: 0,
      tcsPaid: 0,
      advanceTax: 0,
      selfAssessmentTax: 0,
      totalTDS: 0,
      totalPrepaid: 0
    },
    regime: 'NEW'
  };
}
