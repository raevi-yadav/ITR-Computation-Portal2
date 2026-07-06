import { ITR4Data, PersonalDetails, BankDetails, SalaryIncome, HousePropertyIncome, PresumptiveBusiness, PresumptiveProfession, OtherSourcesIncome, TaxDeductions, PrepaidTax } from '../types';
import { SAMPLE_DATA } from './taxCalculator';

/**
 * Attempts to parse an Indian ITR-4 JSON schema or a simplified JSON schema,
 * returning a full structured ITR4Data object.
 */
export function parseITR4JSON(jsonText: string): ITR4Data {
  try {
    const raw = JSON.parse(jsonText);
    
    // Create copy of default sample data to merge into so that empty fields are pre-populated safely
    const data: ITR4Data = JSON.parse(JSON.stringify(SAMPLE_DATA));
    
    // Check if it's a standard Indian Income Tax Dept JSON schema (usually has ITR or ITR4 keys)
    const itrRoot = raw.ITR || raw;
    const itr4 = itrRoot.ITR4 || itrRoot;

    // Helper functions for parsing AY and FY robustly
    const parseAY = (val: any): string => {
      if (!val) return '2026-27';
      const s = val.toString().trim();
      if (s.includes('-')) return s;
      const yr = parseInt(s, 10);
      if (!isNaN(yr)) {
        return `${yr}-${(yr + 1) % 100}`;
      }
      return s;
    };

    const parseFY = (val: any): string => {
      if (!val) return '2025-26';
      const s = val.toString().trim();
      if (s.includes('-')) return s;
      const yr = parseInt(s, 10);
      if (!isNaN(yr)) {
        return `${yr - 1}-${yr % 100}`;
      }
      return s;
    };

    // Parse Assessment Year and Financial Year if present
    const ayVal = raw.AssessmentYear || raw.AssesmentYear || raw.AY || itrRoot.AssessmentYear || itrRoot.AssesmentYear || itrRoot.AY || itr4.AssessmentYear || itr4.AssesmentYear || itr4.AY;
    if (ayVal) {
      data.personal.assessmentYear = parseAY(ayVal);
    }
    const fyVal = raw.FinancialYear || raw.FY || itrRoot.FinancialYear || itrRoot.FY || itr4.FinancialYear || itr4.FY;
    if (fyVal) {
      data.personal.financialYear = parseFY(fyVal);
    }

    // 1. Personal Details parsing
    if (itr4.PersonalInfo || itr4.AssesseeName || itr4.PAN) {
      const personal = itr4.PersonalInfo || {};
      const nameObj = personal.AssesseeName || itr4.AssesseeName || {};
      
      const firstName = nameObj.FirstName || '';
      const middleName = nameObj.MiddleName || '';
      const surName = nameObj.SurName || '';
      const fullName = [firstName, middleName, surName].filter(Boolean).join(' ').trim();
      
      if (fullName) data.personal.name = fullName;
      if (personal.PAN || itr4.PAN) data.personal.pan = (personal.PAN || itr4.PAN).toUpperCase();
      if (personal.DOB || itr4.DOB) data.personal.dob = personal.DOB || itr4.DOB;
      if (personal.AadhaarCardNo) data.personal.aadhaar = personal.AadhaarCardNo;
      
      const contact = personal.Address || {};
      if (contact.MobileNo) data.personal.mobile = contact.MobileNo;
      if (contact.EmailAddress) data.personal.email = contact.EmailAddress;
      
      // Construct address
      const addrParts = [
        contact.RoadStreet || contact.FlatDoorBlock || '',
        contact.AreaLocality || '',
        contact.CityTownDistrict || '',
        contact.StateCode || '',
        contact.PinCode || ''
      ].filter(Boolean);
      if (addrParts.length > 0) {
        data.personal.address = addrParts.join(', ');
        data.personal.street = contact.RoadStreet || contact.FlatDoorBlock || '101, SAMPLE TOWER';
        data.personal.area = contact.AreaLocality || 'DEMO AREA';
        data.personal.city = contact.CityTownDistrict || 'LUCKNOW';
        data.personal.state = contact.StateCode || 'State 09';
        data.personal.pinCode = contact.PinCode || '226001';
      }
      
      if (itrRoot.FilingStatus?.SectionCode) {
        data.personal.filingSection = itrRoot.FilingStatus.SectionCode;
      }
    }

    // 2. Bank details parsing
    if (itr4.Refund?.BankAccounts || itr4.BankAccountDetails) {
      const accounts = itr4.Refund?.BankAccounts || itr4.BankAccountDetails || [];
      const primaryAcc = Array.isArray(accounts) ? accounts[0] : accounts;
      if (primaryAcc) {
        if (primaryAcc.BankName) data.bank.bankName = primaryAcc.BankName;
        if (primaryAcc.IFSCCode || primaryAcc.IFSC) data.bank.ifsc = primaryAcc.IFSCCode || primaryAcc.IFSC;
        if (primaryAcc.AccountNumber || primaryAcc.AccNo) data.bank.accountNumber = primaryAcc.AccountNumber || primaryAcc.AccNo;
      }
    }

    // 3. Salary details parsing
    if (itr4.IncomeDeductions || itr4.IncomeFromSalary || itr4.Salary) {
      const sal = itr4.IncomeDeductions?.Salary || itr4.IncomeFromSalary || itr4.Salary || {};
      if (sal.GrossSalary) data.salary.grossSalary = Number(sal.GrossSalary);
      if (sal.StandardDeduction || sal.DeductionUs16ia) {
        data.salary.standardDeduction = Number(sal.StandardDeduction || sal.DeductionUs16ia);
      }
    }

    // 4. Presumptive Business (44AD)
    if (itr4.ScheduleBP || itr4.PresumptiveBusiness || itr4.BP) {
      const bp = itr4.ScheduleBP || itr4.PresumptiveBusiness || itr4.BP || {};
      const sec44AD = bp.PersumptiveIncBusiness || bp.Sec44AD || {};
      
      if (sec44AD.GrossReceiptDoubleInd) data.business44AD.turnoverBank = Number(sec44AD.GrossReceiptDoubleInd);
      if (sec44AD.GrossReceiptOtherMode) data.business44AD.turnoverCash = Number(sec44AD.GrossReceiptOtherMode);
      if (sec44AD.PersumptiveIncDigitalMode) data.business44AD.presumptiveIncomeBank = Number(sec44AD.PersumptiveIncDigitalMode);
      if (sec44AD.PersumptiveIncOtherMode) data.business44AD.presumptiveIncomeCash = Number(sec44AD.PersumptiveIncOtherMode);
      
      const totProf = Number(sec44AD.TotalPersumptiveInc || sec44AD.PresumptiveIncomeTotal || 0);
      if (totProf) {
        data.business44AD.presumptiveIncomeTotal = totProf;
      } else {
        data.business44AD.presumptiveIncomeTotal = data.business44AD.presumptiveIncomeBank + data.business44AD.presumptiveIncomeCash;
      }
      
      // Financial particulars (Schedule KP / Balance Sheet)
      const kp = bp.ScheduleKP || bp.FinancialParticulars || {};
      if (kp.CashInHand) data.business44AD.cashInHand = Number(kp.CashInHand);
      if (kp.TotalAssets) data.business44AD.totalAssets = Number(kp.TotalAssets);
      if (kp.ClosingStock) data.business44AD.closingStock = Number(kp.ClosingStock);
      if (kp.OpeningStock) data.business44AD.openingStock = Number(kp.OpeningStock);
      if (kp.Purchases) data.business44AD.purchases = Number(kp.Purchases);
      if (kp.Freight) data.business44AD.freight = Number(kp.Freight);
      if (kp.SundryCreditors) data.business44AD.sundryCreditors = Number(kp.SundryCreditors);
      if (kp.SundryDebtors) data.business44AD.sundryDebtors = Number(kp.SundryDebtors);
      if (kp.CapitalAccount) data.business44AD.capital = Number(kp.CapitalAccount);
      if (kp.OtherLiabilities) data.business44AD.otherLiabilities = Number(kp.OtherLiabilities);
      if (kp.BankBalance) data.business44AD.bankBalance = Number(kp.BankBalance);
      if (kp.FixedAssets) data.business44AD.fixedAssets = Number(kp.FixedAssets);
    }

    // 5. Presumptive Profession (44ADA)
    if (itr4.ScheduleBP || itr4.PresumptiveProfession) {
      const bp = itr4.ScheduleBP || {};
      const sec44ADA = bp.PersumptiveIncProfession || bp.Sec44ADA || {};
      if (sec44ADA.GrossReceipt) data.profession44ADA.grossReceipts = Number(sec44ADA.GrossReceipt);
      if (sec44ADA.PersumptiveInc) data.profession44ADA.presumptiveIncome = Number(sec44ADA.PersumptiveInc);
    }

    // 6. Other Sources Details
    if (itr4.IncomeDeductions?.IncomeFromOtherSources || itr4.OtherSources) {
      const os = itr4.IncomeDeductions?.IncomeFromOtherSources || itr4.OtherSources || {};
      if (os.InterestSavings) data.otherSources.interestSavings = Number(os.InterestSavings);
      if (os.InterestOthers) data.otherSources.interestOthers = Number(os.InterestOthers);
      if (os.DividendIncome) data.otherSources.dividendIncome = Number(os.DividendIncome);
      if (os.OtherIncome) data.otherSources.otherIncome = Number(os.OtherIncome);
      
      data.otherSources.totalOtherSources = data.otherSources.interestSavings + 
                                            data.otherSources.interestOthers + 
                                            data.otherSources.dividendIncome + 
                                            data.otherSources.otherIncome;
    }

    // 7. Prepaid Tax
    if (itr4.TaxPaid || raw.TaxPaid) {
      const tp = itr4.TaxPaid || raw.TaxPaid || {};
      if (tp.TDSSalary) data.prepaid.tdsSalary = Number(tp.TDSSalary);
      if (tp.TDSOthers) data.prepaid.tdsOthers = Number(tp.TDSOthers);
      if (tp.TCSPaid) data.prepaid.tcsPaid = Number(tp.TCSPaid);
      if (tp.AdvanceTax) data.prepaid.advanceTax = Number(tp.AdvanceTax);
      if (tp.SelfAssessmentTax) data.prepaid.selfAssessmentTax = Number(tp.SelfAssessmentTax);
      
      data.prepaid.totalTDS = data.prepaid.tdsSalary + data.prepaid.tdsOthers;
      data.prepaid.totalPrepaid = data.prepaid.totalTDS + data.prepaid.tcsPaid + data.prepaid.advanceTax + data.prepaid.selfAssessmentTax;
    }

    // Direct flat mappings if the uploaded file is our simplified exported schema
    if (raw.personal) data.personal = { ...data.personal, ...raw.personal };
    if (raw.bank) data.bank = { ...data.bank, ...raw.bank };
    if (raw.salary) data.salary = { ...data.salary, ...raw.salary };
    if (raw.houseProperty) data.houseProperty = { ...data.houseProperty, ...raw.houseProperty };
    if (raw.business44AD) data.business44AD = { ...data.business44AD, ...raw.business44AD };
    if (raw.profession44ADA) data.profession44ADA = { ...data.profession44ADA, ...raw.profession44ADA };
    if (raw.otherSources) data.otherSources = { ...data.otherSources, ...raw.otherSources };
    if (raw.deductions) data.deductions = { ...data.deductions, ...raw.deductions };
    if (raw.prepaid) data.prepaid = { ...data.prepaid, ...raw.prepaid };
    if (raw.regime) data.regime = raw.regime;

    // Recompute Net Salary
    data.salary.netSalary = Math.max(0, data.salary.grossSalary - data.salary.standardDeduction);

    return data;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    throw new Error('Invalid JSON format. Please ensure the file is a valid ITR-4 JSON file.');
  }
}
