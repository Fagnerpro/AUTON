/**
 * Solar System Calculation Utilities
 * Centralized solar calculation functions for different system types
 */

export function calculateResidentialSystem(params: any) {
  const numUnits = parseInt(params.num_units) || 0;
  const consumptionPerUnit = parseFloat(params.consumption_per_unit) || 0;
  const availableArea = parseFloat(params.available_area) || 0;
  
  const totalConsumption = numUnits * consumptionPerUnit * 12; // Annual consumption
  const panelPower = 550; // Watts per panel
  const systemEfficiency = 0.85;
  const sunHours = 5.5; // Daily sun hours
  
  const requiredPower = (totalConsumption / (sunHours * 365 * systemEfficiency)) * 1000;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000; // kWp
  const requiredArea = numPanels * 2.1; // m² per panel
  const annualGeneration = actualPower * sunHours * 365 * systemEfficiency;
  
  const costPerWatt = 4.5; // R$ per Wp
  const totalInvestment = actualPower * 1000 * costPerWatt;
  const energyTariff = 0.65; // R$ per kWh
  const annualSavings = annualGeneration * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  const roi25Years = ((annualSavings * 25) / totalInvestment) * 100;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    required_area: requiredArea,
    annual_generation: annualGeneration,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: roi25Years,
    area_sufficient: availableArea >= requiredArea,
    area_status: availableArea >= requiredArea ? 
      'Área suficiente para instalação completa' : 
      `Área insuficiente. Necessário ${requiredArea.toFixed(0)}m², disponível ${availableArea}m²`
  };
}

export function calculateEVChargingSystem(params: any) {
  const numSpots = parseInt(params.num_parking_spots) || 0;
  const chargingPercentage = parseFloat(params.charging_points_percentage) || 0;
  const energyPerCharge = parseFloat(params.energy_per_charge) || 18;
  const chargesPerDay = parseFloat(params.charges_per_day) || 1;
  
  const chargingPoints = Math.floor(numSpots * chargingPercentage / 100);
  const dailyConsumption = chargingPoints * energyPerCharge * chargesPerDay;
  const annualConsumption = dailyConsumption * 365;
  
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (dailyConsumption / (sunHours * systemEfficiency)) * 1000;
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  
  const batteryCapacity = dailyConsumption * 1.2; // 20% extra capacity
  const costPerWatt = 4.5;
  const batteryCostPerKWh = 800;
  const totalInvestment = (actualPower * 1000 * costPerWatt) + (batteryCapacity * batteryCostPerKWh);
  
  const chargingRevenue = 0.15; // R$ per kWh charging fee
  const annualSavings = annualConsumption * chargingRevenue;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_charging_points: chargingPoints,
    num_panels: numPanels,
    total_power: actualPower,
    daily_consumption: dailyConsumption,
    annual_consumption: annualConsumption,
    battery_capacity: batteryCapacity,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100
  };
}

export function calculateCommercialSystem(params: any) {
  const monthlyConsumption = parseFloat(params.monthly_consumption) || 0;
  const availableArea = parseFloat(params.available_area) || 0;
  
  const annualConsumption = monthlyConsumption * 12;
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (annualConsumption / (sunHours * 365 * systemEfficiency)) * 1000;
  
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  const requiredArea = numPanels * 2.1;
  const annualGeneration = actualPower * sunHours * 365 * systemEfficiency;
  
  const costPerWatt = 4.2; // Commercial systems are slightly cheaper per watt
  const totalInvestment = actualPower * 1000 * costPerWatt;
  const energyTariff = 0.75; // Commercial tariff is higher
  const annualSavings = annualGeneration * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    required_area: requiredArea,
    annual_generation: annualGeneration,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100,
    area_sufficient: availableArea >= requiredArea
  };
}

export function calculateCommonAreasSystem(params: any) {
  const dailyConsumption = parseFloat(params.daily_consumption) || 0;
  const criticalConsumption = parseFloat(params.critical_consumption_per_hour) || 0;
  const backupHours = parseFloat(params.backup_hours) || 8;
  
  const annualConsumption = dailyConsumption * 365;
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (dailyConsumption / (sunHours * systemEfficiency)) * 1000;
  
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  
  const batteryCapacity = criticalConsumption * backupHours;
  const costPerWatt = 4.5;
  const batteryCostPerKWh = 800;
  const totalInvestment = (actualPower * 1000 * costPerWatt) + (batteryCapacity * batteryCostPerKWh);
  
  const energyTariff = 0.65;
  const annualSavings = annualConsumption * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    daily_consumption: dailyConsumption,
    annual_consumption: annualConsumption,
    battery_capacity: batteryCapacity,
    backup_hours: backupHours,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100
  };
}

/**
 * Calculate system based on type
 */
export function calculateSystem(type: string, params: any) {
  switch (type) {
    case 'residential':
      return calculateResidentialSystem(params);
    case 'commercial':
      return calculateCommercialSystem(params);
    case 'ev_charging':
      return calculateEVChargingSystem(params);
    case 'common_areas':
      return calculateCommonAreasSystem(params);
    default:
      throw new Error(`Unknown system type: ${type}`);
  }
}
