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
