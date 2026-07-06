import { ITR4Data, PersonalDetails, BankDetails, SalaryIncome, HousePropertyIncome, PresumptiveBusiness, PresumptiveProfession, OtherSourcesIncome, TaxDeductions, PrepaidTax, createBlankData } from '../types';

export const STATE_CODES_MAP: Record<string, string> = {
  "01": "ANDAMAN AND NICOBAR ISLANDS",
  "02": "ANDHRA PRADESH",
  "03": "ARUNACHAL PRADESH",
  "04": "ASSAM",
  "05": "BIHAR",
  "06": "CHANDIGARH",
  "07": "DADRA AND NAGAR HAVELI",
  "08": "DAMAN AND DIU",
  "09": "DELHI",
  "10": "GOA",
  "11": "GUJARAT",
  "12": "HARYANA",
  "13": "HIMACHAL PRADESH",
  "14": "JAMMU AND KASHMIR",
  "15": "KARNATAKA",
  "16": "KERALA",
  "17": "LAKSHADWEEP",
  "18": "MADHYA PRADESH",
  "19": "MAHARASHTRA",
  "20": "MANIPUR",
  "21": "MEGHALAYA",
  "22": "MIZORAM",
  "23": "NAGALAND",
  "24": "ODISHA",
  "25": "PUDUCHERRY",
  "26": "PUNJAB",
  "27": "RAJASTHAN",
  "28": "SIKKIM",
  "29": "TAMIL NADU",
  "30": "TRIPURA",
  "31": "UTTAR PRADESH",
  "32": "WEST BENGAL",
  "33": "CHHATTISGARH",
  "34": "UTTARAKHAND",
  "35": "JHARKHAND",
  "36": "TELANGANA",
  "37": "LADAKH",
  "99": "FOREIGN COUNTRY ADDRESS"
};

/**
 * Attempts to parse an Indian ITR-4 JSON schema or a simplified JSON schema,
 * returning a full structured ITR4Data object.
 */
export function parseITR4JSON(jsonText: string): ITR4Data {
  try {
    const raw = JSON.parse(jsonText);
    
    // Create copy of default blank data to merge into so that empty fields are not pre-populated with demo values
    const data: ITR4Data = createBlankData();
    
    // Check if it's a standard Indian Income Tax Dept JSON schema (usually has ITR or ITR4 keys)
    const itrRoot = raw.ITR || raw;
    const itr4 = itrRoot.ITR4 || itrRoot;

    // Helper functions for parsing AY and FY robustly
    const parseAY = (val: any): string => {
      if (!val) return '';
      const s = val.toString().trim();
      if (s.includes('-')) return s;
      const yr = parseInt(s, 10);
      if (!isNaN(yr)) {
        return `${yr}-${(yr + 1) % 100}`;
      }
      return s;
    };

    const parseFY = (val: any): string => {
      if (!val) return '';
      const s = val.toString().trim();
      if (s.includes('-')) return s;
      const yr = parseInt(s, 10);
      if (!isNaN(yr)) {
        return `${yr - 1}-${yr % 100}`;
      }
      return s;
    };

    // Parse Assessment Year and Financial Year if present
    const ayVal = raw.AssessmentYear || raw.AssesmentYear || raw.AY || 
                  itrRoot.AssessmentYear || itrRoot.AssesmentYear || itrRoot.AY || 
                  itr4.AssessmentYear || itr4.AssesmentYear || itr4.AY ||
                  itr4.Form_ITR4?.AssessmentYear ||
                  raw.ITR4?.Form_ITR4?.AssessmentYear;
                  
    if (ayVal) {
      data.personal.assessmentYear = parseAY(ayVal);
    }
    
    const fyVal = raw.FinancialYear || raw.FY || itrRoot.FinancialYear || itrRoot.FY || itr4.FinancialYear || itr4.FY;
    if (fyVal) {
      data.personal.financialYear = parseFY(fyVal);
    } else if (data.personal.assessmentYear) {
      // Deduce Financial Year from Assessment Year (FY = AY - 1)
      const parts = data.personal.assessmentYear.split('-');
      const startYr = parseInt(parts[0], 10);
      if (!isNaN(startYr)) {
        data.personal.financialYear = `${startYr - 1}-${startYr % 100}`;
      }
    }

    // 1. Personal Details parsing
    const personal = itr4.PersonalInfo || {};
    const nameObj = personal.AssesseeName || itr4.AssesseeName || {};
    
    const firstName = nameObj.FirstName || nameObj.FirstNameOrOrgName || '';
    const middleName = nameObj.MiddleName || '';
    const surName = nameObj.SurName || nameObj.SurNameOrOrgName || '';
    
    let fullName = [firstName, middleName, surName].map(s => s.toString().trim()).filter(Boolean).join(' ').trim();
    if (!fullName && itr4.Verification?.Declaration?.AssesseeVerName) {
      fullName = itr4.Verification.Declaration.AssesseeVerName;
    }
    
    if (fullName) data.personal.name = fullName;
    
    const panVal = personal.PAN || itr4.PAN || itr4.Verification?.Declaration?.AssesseeVerPAN || '';
    if (panVal) data.personal.pan = panVal.toUpperCase();
    
    if (personal.DOB || itr4.DOB) data.personal.dob = personal.DOB || itr4.DOB;
    if (personal.AadhaarCardNo) data.personal.aadhaar = personal.AadhaarCardNo;
    
    const contact = personal.Address || {};
    if (contact.MobileNo) data.personal.mobile = contact.MobileNo.toString();
    if (contact.EmailAddress) data.personal.email = contact.EmailAddress;
    
    // Construct address
    const resNo = contact.ResidenceNo || '';
    const resName = contact.ResidenceName || '';
    const street = contact.RoadOrStreet || contact.RoadStreet || contact.FlatDoorBlock || '';
    const area = contact.LocalityOrArea || contact.AreaLocality || '';
    const city = contact.CityOrTownOrDistrict || contact.CityTownDistrict || '';
    const state = contact.StateCode || '';
    const pin = contact.PinCode || '';

    // Resolve State Code to State Name
    const stateStr = state.toString().trim();
    const formattedStateCode = stateStr.padStart(2, '0');
    const stateName = STATE_CODES_MAP[formattedStateCode] || stateStr;

    const streetCombined = [resNo, resName, street].map(s => s.toString().trim()).filter(Boolean).join(', ');
    const addrParts = [
      streetCombined,
      area,
      city,
      stateName,
      pin
    ].map(s => s.toString().trim()).filter(Boolean);

    if (addrParts.length > 0) {
      data.personal.address = addrParts.join(', ');
      data.personal.street = streetCombined;
      data.personal.area = area.toString();
      data.personal.city = city.toString();
      data.personal.state = stateName;
      data.personal.pinCode = pin.toString();
    }
    
    const filing = itr4.FilingStatus || {};
    if (filing.ItrFilingDueDate) {
      data.personal.dueDate = filing.ItrFilingDueDate;
    }
    if (filing.ReturnFileSec) {
      const secCode = filing.ReturnFileSec.toString();
      if (secCode === '11') {
        data.personal.filingSection = '139(1) - On or before due date';
      } else if (secCode === '12') {
        data.personal.filingSection = '139(4) - Belated Return';
      } else if (secCode === '13') {
        data.personal.filingSection = '139(5) - Revised Return';
      } else {
        data.personal.filingSection = `139`;
      }
    } else if (filing.SectionCode) {
      data.personal.filingSection = filing.SectionCode;
    }

    // 1b. Father Name & Filing Place
    const verification = itr4.Verification || {};
    if (verification.Declaration?.FatherName) {
      data.personal.fatherName = verification.Declaration.FatherName;
    }
    if (verification.Place) {
      data.personal.place = verification.Place;
    }

    // 2. Bank details parsing
    const refund = itr4.Refund || {};
    const bankDtls = refund.BankAccountDtls || {};
    const addtnlBankDetails = bankDtls.AddtnlBankDetails || refund.BankAccounts || itr4.BankAccountDetails || [];
    const primaryAcc = Array.isArray(addtnlBankDetails) ? addtnlBankDetails[0] : addtnlBankDetails;
    if (primaryAcc) {
      if (primaryAcc.BankName) data.bank.bankName = primaryAcc.BankName;
      if (primaryAcc.IFSCCode || primaryAcc.IFSC) data.bank.ifsc = primaryAcc.IFSCCode || primaryAcc.IFSC;
      if (primaryAcc.BankAccountNo || primaryAcc.AccountNumber || primaryAcc.AccNo) {
        data.bank.accountNumber = primaryAcc.BankAccountNo || primaryAcc.AccountNumber || primaryAcc.AccNo;
      }
    }

    // 3. Salary details parsing
    if (itr4.IncomeDeductions || itr4.IncomeFromSalary || itr4.Salary) {
      const sal = itr4.IncomeDeductions || itr4.IncomeFromSalary || itr4.Salary || {};
      if (sal.GrossSalary !== undefined) data.salary.grossSalary = Number(sal.GrossSalary);
      
      const stdDed = sal.DeductionUs16ia || sal.StandardDeduction || (sal.Salary && (sal.Salary.StandardDeduction || sal.Salary.DeductionUs16ia));
      if (stdDed !== undefined) {
        data.salary.standardDeduction = Number(stdDed);
      } else {
        data.salary.standardDeduction = data.salary.grossSalary > 0 ? 75000 : 0;
      }
    }

    // 3b. House Property Income
    if (itr4.IncomeDeductions) {
      const hpVal = itr4.IncomeDeductions.TotalIncomeChargeableUnHP || itr4.IncomeDeductions.IncomeFromHP;
      if (hpVal !== undefined) {
        data.houseProperty.netHPIncome = Number(hpVal);
      }
    }

    // 4. Presumptive Business (44AD)
    if (itr4.ScheduleBP || itr4.PresumptiveBusiness || itr4.BP) {
      const bp = itr4.ScheduleBP || itr4.PresumptiveBusiness || itr4.BP || {};
      const sec44AD = bp.PersumptiveInc44AD || bp.PersumptiveIncBusiness || bp.Sec44AD || {};
      
      const totalTrnOver = Number(sec44AD.GrsTotalTrnOver || 0);
      const trnOverCash = Number(sec44AD.GrsTotalTrnOverInCash || sec44AD.GrossReceiptOtherMode || 0);
      const trnOverBank = Number(sec44AD.GrossReceiptDoubleInd || (totalTrnOver - trnOverCash > 0 ? totalTrnOver - trnOverCash : 0));
      
      data.business44AD.turnoverCash = trnOverCash;
      data.business44AD.turnoverBank = trnOverBank;
      
      const incCash = Number(sec44AD.PersumptiveInc44AD8Per || sec44AD.PersumptiveIncOtherMode || 0);
      const incBank = Number(sec44AD.PersumptiveInc44AD6Per || sec44AD.PersumptiveIncDigitalMode || 0);
      
      data.business44AD.presumptiveIncomeCash = incCash;
      data.business44AD.presumptiveIncomeBank = incBank;
      
      const totProf = Number(sec44AD.TotPersumptiveInc44AD || sec44AD.TotalPersumptiveInc || sec44AD.PresumptiveIncomeTotal || 0);
      if (totProf) {
        data.business44AD.presumptiveIncomeTotal = totProf;
      } else {
        data.business44AD.presumptiveIncomeTotal = incCash + incBank;
      }
      
      // Financial particulars (Schedule KP / Balance Sheet)
      const kp = bp.FinanclPartclrOfBusiness || bp.ScheduleKP || bp.FinancialParticulars || {};
      if (kp.CashInHand !== undefined) data.business44AD.cashInHand = Number(kp.CashInHand);
      if (kp.TotalAssets !== undefined) data.business44AD.totalAssets = Number(kp.TotalAssets);
      if (kp.Inventories !== undefined || kp.ClosingStock !== undefined) {
        data.business44AD.closingStock = Number(kp.Inventories !== undefined ? kp.Inventories : kp.ClosingStock);
      }
      if (kp.OpeningStock !== undefined) data.business44AD.openingStock = Number(kp.OpeningStock);
      if (kp.Purchases !== undefined) data.business44AD.purchases = Number(kp.Purchases);
      if (kp.Freight !== undefined) data.business44AD.freight = Number(kp.Freight);
      if (kp.SundryCreditors !== undefined) data.business44AD.sundryCreditors = Number(kp.SundryCreditors);
      if (kp.SundryDebtors !== undefined) data.business44AD.sundryDebtors = Number(kp.SundryDebtors);
      
      if (kp.PartnerMemberOwnCapital !== undefined || kp.CapitalAccount !== undefined) {
        data.business44AD.capital = Number(kp.PartnerMemberOwnCapital !== undefined ? kp.PartnerMemberOwnCapital : kp.CapitalAccount);
      }
      if (kp.OthrCurrLiab !== undefined || kp.OtherLiabilities !== undefined) {
        data.business44AD.otherLiabilities = Number(kp.OthrCurrLiab !== undefined ? kp.OthrCurrLiab : kp.OtherLiabilities);
      }
      if (kp.BalWithBanks !== undefined || kp.BankBalance !== undefined) {
        data.business44AD.bankBalance = Number(kp.BalWithBanks !== undefined ? kp.BalWithBanks : kp.BankBalance);
      }
      if (kp.FixedAssets !== undefined) data.business44AD.fixedAssets = Number(kp.FixedAssets);
    }

    // 5. Presumptive Profession (44ADA)
    if (itr4.ScheduleBP || itr4.PresumptiveProfession) {
      const bp = itr4.ScheduleBP || {};
      const sec44ADA = bp.PersumptiveInc44ADA || bp.PersumptiveIncProfession || bp.Sec44ADA || {};
      if (sec44ADA.GrsReceipt) data.profession44ADA.grossReceipts = Number(sec44ADA.GrsReceipt);
      if (sec44ADA.PersumptiveInc) data.profession44ADA.presumptiveIncome = Number(sec44ADA.PersumptiveInc);
    }

    // 6. Other Sources Details
    if (itr4.IncomeDeductions || itr4.OtherSources) {
      const incDed = itr4.IncomeDeductions || {};
      const os = incDed.IncomeFromOtherSources || itr4.OtherSources || {};
      
      // Reset values first
      data.otherSources.interestSavings = 0;
      data.otherSources.interestOthers = 0;
      data.otherSources.dividendIncome = 0;
      data.otherSources.otherIncome = 0;
      data.otherSources.totalOtherSources = 0;

      // Check flat properties first
      if (os.InterestSavings !== undefined) data.otherSources.interestSavings = Number(os.InterestSavings);
      if (os.InterestOthers !== undefined) data.otherSources.interestOthers = Number(os.InterestOthers);
      if (os.DividendIncome !== undefined) data.otherSources.dividendIncome = Number(os.DividendIncome);
      if (os.OtherIncome !== undefined) data.otherSources.otherIncome = Number(os.OtherIncome);

      // Now check the OthersIncDtlsOthSrc array
      const othersInc = incDed.OthersInc || {};
      const list = othersInc.OthersIncDtlsOthSrc || [];
      if (Array.isArray(list) && list.length > 0) {
        for (const item of list) {
          const desc = (item.OthSrcNatureDesc || '').toUpperCase();
          const amt = Number(item.OthSrcOthAmount || item.Amount || 0);
          if (desc === 'SAV') {
            data.otherSources.interestSavings = amt;
          } else if (desc === 'DIV') {
            data.otherSources.dividendIncome = amt;
          } else if (desc.includes('OTH') || desc.includes('INT') || desc === 'OIP') {
            data.otherSources.interestOthers = amt;
          } else {
            data.otherSources.otherIncome += amt;
          }
        }
      }

      // If we got flat total but everything else was zero, put it in otherIncome
      const totalOS = Number(incDed.IncomeOthSrc || os.TotalOtherSources || os.IncomeOthSrc || 0);
      data.otherSources.totalOtherSources = totalOS;

      const sumDerived = data.otherSources.interestSavings + data.otherSources.interestOthers + data.otherSources.dividendIncome + data.otherSources.otherIncome;
      if (totalOS > 0 && sumDerived === 0) {
        data.otherSources.otherIncome = totalOS;
        data.otherSources.totalOtherSources = totalOS;
      } else if (sumDerived > 0) {
        data.otherSources.totalOtherSources = sumDerived;
      }
    }

    // 6b. Tax Deductions (Chapter VIA)
    if (itr4.IncomeDeductions) {
      const dedObj = itr4.IncomeDeductions.DeductUndChapVIA || itr4.IncomeDeductions.UsrDeductUndChapVIA || {};
      if (dedObj.Section80C !== undefined) data.deductions.sec80C = Number(dedObj.Section80C);
      if (dedObj.Section80D !== undefined) data.deductions.sec80D = Number(dedObj.Section80D);
      if (dedObj.Section80G !== undefined) data.deductions.sec80G = Number(dedObj.Section80G);
      
      const tta = Number(dedObj.Section80TTA || 0);
      const ttb = Number(dedObj.Section80TTB || 0);
      data.deductions.sec80TTA = tta > 0 ? tta : ttb;

      const totalDed = Number(dedObj.TotalChapVIADeductions || 0);
      if (totalDed > 0) {
        data.deductions.totalDeductions = totalDed;
      } else {
        data.deductions.totalDeductions = data.deductions.sec80C + data.deductions.sec80D + data.deductions.sec80G + data.deductions.sec80TTA;
      }
    }

    // 7. Prepaid Tax
    if (itr4.TaxPaid || raw.TaxPaid) {
      const tp = itr4.TaxPaid || raw.TaxPaid || {};
      const taxesPaid = tp.TaxesPaid || {};
      
      if (taxesPaid.TCS !== undefined) data.prepaid.tcsPaid = Number(taxesPaid.TCS);
      if (taxesPaid.AdvanceTax !== undefined) data.prepaid.advanceTax = Number(taxesPaid.AdvanceTax);
      if (taxesPaid.SelfAssessmentTax !== undefined) data.prepaid.selfAssessmentTax = Number(taxesPaid.SelfAssessmentTax);
      
      if (taxesPaid.TDS !== undefined) {
        data.prepaid.totalTDS = Number(taxesPaid.TDS);
        data.prepaid.tdsOthers = Number(taxesPaid.TDS);
      }

      if (tp.TDSSalary !== undefined) data.prepaid.tdsSalary = Number(tp.TDSSalary);
      if (tp.TDSOthers !== undefined) data.prepaid.tdsOthers = Number(tp.TDSOthers);
      if (tp.TCSPaid !== undefined) data.prepaid.tcsPaid = Number(tp.TCSPaid);
      if (tp.AdvanceTax !== undefined && taxesPaid.AdvanceTax === undefined) data.prepaid.advanceTax = Number(tp.AdvanceTax);
      if (tp.SelfAssessmentTax !== undefined && taxesPaid.SelfAssessmentTax === undefined) data.prepaid.selfAssessmentTax = Number(tp.SelfAssessmentTax);

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
