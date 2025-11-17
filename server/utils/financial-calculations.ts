/**
 * Advanced Financial Calculations for Solar Systems
 * ROI, Cash Flow Analysis, and Financial Metrics
 */

export interface CashFlowMonth {
  month: number;
  monthlyFlow: number;
  accumulatedFlow: number;
  savings: number;
  investment: number;
}

export interface FinancialMetrics {
  roi_annual: number;
  roi_25_years: number;
  payback_months: number;
  total_savings_25_years: number;
  net_profit_25_years: number;
}

/**
 * Calculate monthly cash flow for 24 months
 * @param totalInvestment - Initial investment
 * @param monthlySavings - Monthly savings from solar generation
 * @param months - Number of months to calculate (default: 24)
 */
export function calculateMonthlyCashFlow(
  totalInvestment: number,
  monthlySavings: number,
  months: number = 24
): CashFlowMonth[] {
  const cashFlowData: CashFlowMonth[] = [];
  let accumulatedFlow = 0;

  for (let month = 1; month <= months; month++) {
    // First month includes the investment cost
    const investment = month === 1 ? totalInvestment : 0;
    const savings = monthlySavings;
    const monthlyFlow = savings - investment;
    
    accumulatedFlow += monthlyFlow;

    cashFlowData.push({
      month,
      monthlyFlow: Math.round(monthlyFlow * 100) / 100,
      accumulatedFlow: Math.round(accumulatedFlow * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      investment: Math.round(investment * 100) / 100
    });
  }

  return cashFlowData;
}

/**
 * Calculate comprehensive financial metrics
 * @param totalInvestment - Initial investment
 * @param annualSavings - Annual savings
 * @param projectYears - Project lifetime (default: 25 years)
 */
export function calculateFinancialMetrics(
  totalInvestment: number,
  annualSavings: number,
  projectYears: number = 25
): FinancialMetrics {
  // ROI Anualizado (Annual ROI)
  const roi_annual = (annualSavings / totalInvestment) * 100;
  
  // ROI Total de 25 anos
  const totalSavings25Years = annualSavings * projectYears;
  const netProfit25Years = totalSavings25Years - totalInvestment;
  const roi_25_years = (netProfit25Years / totalInvestment) * 100;
  
  // Payback em meses
  const paybackYears = totalInvestment / annualSavings;
  const payback_months = paybackYears * 12;

  return {
    roi_annual: Math.round(roi_annual * 10) / 10,
    roi_25_years: Math.round(roi_25_years * 10) / 10,
    payback_months: Math.round(payback_months * 10) / 10,
    total_savings_25_years: Math.round(totalSavings25Years * 100) / 100,
    net_profit_25_years: Math.round(netProfit25Years * 100) / 100
  };
}

/**
 * Calculate annual cash flow for longer-term analysis
 * @param totalInvestment - Initial investment
 * @param annualSavings - Annual savings
 * @param years - Number of years to calculate
 * @param tariffIncrease - Annual tariff increase rate (default: 8%)
 */
export function calculateAnnualCashFlow(
  totalInvestment: number,
  annualSavings: number,
  years: number = 25,
  tariffIncrease: number = 0.08
): { year: number; savings: number; accumulated: number }[] {
  const cashFlow = [];
  let accumulated = -totalInvestment;

  for (let year = 1; year <= years; year++) {
    // Apply tariff increase year-over-year
    const yearSavings = annualSavings * Math.pow(1 + tariffIncrease, year - 1);
    accumulated += yearSavings;

    cashFlow.push({
      year,
      savings: Math.round(yearSavings * 100) / 100,
      accumulated: Math.round(accumulated * 100) / 100
    });
  }

  return cashFlow;
}
