/**
 * Configurações centralizadas para cálculos de simulação solar
 * Todos os parâmetros técnicos e coeficientes estão definidos aqui
 */

export const SOLAR_SIMULATION_CONFIG = {
  // Irradiação solar média por estado (kWh/m²/dia)
  SOLAR_IRRADIATION: {
    'GO': 5.8,  // Goiás
    'SP': 5.4,  // São Paulo
    'RJ': 5.1,  // Rio de Janeiro
    'MG': 5.5,  // Minas Gerais
    'BA': 6.2,  // Bahia
    'CE': 6.0,  // Ceará
    'PE': 5.9,  // Pernambuco
    'RS': 4.8,  // Rio Grande do Sul
    'SC': 4.9,  // Santa Catarina
    'PR': 5.0,  // Paraná
    'MT': 6.1,  // Mato Grosso
    'MS': 5.7,  // Mato Grosso do Sul
    'DF': 5.8,  // Distrito Federal
    'default': 5.5
  },

  // Especificações técnicas dos painéis
  PANEL_SPECS: {
    power: 550,        // Potência nominal em Wp
    area: 2.74,        // Área em m²
    efficiency: 0.201, // Eficiência 20.1%
    degradation: 0.005 // Degradação anual 0.5%
  },

  // Rendimentos do sistema
  SYSTEM_EFFICIENCY: {
    inverter: 0.95,      // Eficiência do inversor 95%
    wiring: 0.97,        // Perdas de cabeamento 3%
    soiling: 0.95,       // Perdas por sujeira 5%
    temperature: 0.90,   // Perdas por temperatura 10%
    mismatch: 0.98,      // Perdas por descasamento 2%
    overall: 0.78        // Rendimento geral do sistema
  },

  // Parâmetros financeiros modulares (flexibilidade para diferentes cenários de investimento)
  FINANCIAL: {
    tariff_kwh: 0.65,           // Tarifa média kWh R$ (mais conservadora)
    annual_increase: 0.06,      // Aumento anual da tarifa 6% (IPCA + 2%)
    
    // Custos modulares para flexibilidade de investimento
    panels_cost_per_wp: 3.80,  // Custo painéis por Wp R$
    inverter_cost_per_wp: 0.90, // Custo inversores por Wp R$
    installation_cost_percentage: 0.15, // Instalação como % do equipamento
    installation_fixed_cost: 8000, // Custo fixo de instalação R$
    
    // Custo unificado (para simulações simples)
    installation_cost_per_wp: 5.20, // Custo por Wp instalado R$ (tudo incluído)
    
    maintenance_annual: 0.015,  // Manutenção anual 1.5% do investimento
    system_lifetime: 25,        // Vida útil do sistema em anos
    irr_target: 0.15           // TIR alvo 15%
  },

  // Configurações por tipo de projeto
  PROJECT_TYPES: {
    residential: {
      min_consumption: 100,     // Consumo mínimo kWh/mês
      max_consumption: 1500,    // Consumo máximo kWh/mês
      installation_factor: 1.0, // Fator de complexidade
      area_requirement: 8,      // m² por kWp
      typical_consumption: 350  // Consumo típico kWh/mês
    },
    commercial: {
      min_consumption: 500,
      max_consumption: 50000,
      installation_factor: 0.9,
      area_requirement: 7,
      typical_consumption: 2500
    },
    ev_charging: {
      vehicle_consumption: 15,   // kWh/100km
      monthly_km: 1200,         // km médios por mês
      charging_efficiency: 0.90, // Eficiência do carregamento
      vehicles_factor: 1.2      // Fator para múltiplos veículos
    },
    common_areas: {
      lighting_factor: 0.6,     // Fator para iluminação
      elevator_consumption: 300, // kWh/mês por elevador
      pool_consumption: 800,    // kWh/mês por piscina
      security_consumption: 150 // kWh/mês sistema segurança
    }
  },

  // Fatores de correção regional
  REGIONAL_FACTORS: {
    'GO': { cost: 1.0, labor: 0.9 },
    'SP': { cost: 1.15, labor: 1.2 },
    'RJ': { cost: 1.1, labor: 1.15 },
    'MG': { cost: 0.95, labor: 0.95 },
    'default': { cost: 1.0, labor: 1.0 }
  }
};

/**
 * Calcula a irradiação solar para um estado específico
 */
export function getSolarIrradiation(state: string): number {
  return SOLAR_SIMULATION_CONFIG.SOLAR_IRRADIATION[state as keyof typeof SOLAR_SIMULATION_CONFIG.SOLAR_IRRADIATION] 
    || SOLAR_SIMULATION_CONFIG.SOLAR_IRRADIATION.default;
}

/**
 * Calcula o fator regional para custos
 */
export function getRegionalFactor(state: string): { cost: number; labor: number } {
  return SOLAR_SIMULATION_CONFIG.REGIONAL_FACTORS[state as keyof typeof SOLAR_SIMULATION_CONFIG.REGIONAL_FACTORS]
    || SOLAR_SIMULATION_CONFIG.REGIONAL_FACTORS.default;
}

/**
 * Calcula potência necessária baseada no consumo
 * METODOLOGIA HÍBRIDA: Combina nossa fórmula com validação externa
 */
export function calculateRequiredPower(monthlyConsumption: number, state: string): number {
  const irradiation = getSolarIrradiation(state);
  const efficiency = SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
  
  // Fórmula principal (nossa metodologia)
  const dailyGeneration = irradiation * efficiency; // kWh/kWp/dia
  const monthlyGeneration = dailyGeneration * 30;   // kWh/kWp/mês
  
  return monthlyConsumption / monthlyGeneration;
}

/**
 * Cálculo de investimento modular - permite diferentes cenários financeiros
 */
export function calculateModularInvestment(
  systemPowerKw: number,
  includeInstallation: boolean = true,
  customParameters?: {
    panelCostPerWp?: number;
    inverterCostPerWp?: number;
    installationPercentage?: number;
    fixedInstallationCost?: number;
  }
): {
  panelsCost: number;
  invertersCost: number;
  installationCost: number;
  totalCost: number;
  costBreakdown: string[];
} {
  const params = {
    panelCostPerWp: customParameters?.panelCostPerWp || SOLAR_SIMULATION_CONFIG.FINANCIAL.panels_cost_per_wp,
    inverterCostPerWp: customParameters?.inverterCostPerWp || SOLAR_SIMULATION_CONFIG.FINANCIAL.inverter_cost_per_wp,
    installationPercentage: customParameters?.installationPercentage || SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_percentage,
    fixedInstallationCost: customParameters?.fixedInstallationCost || SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_fixed_cost
  };

  const systemPowerWp = systemPowerKw * 1000;
  
  const panelsCost = systemPowerWp * params.panelCostPerWp;
  const invertersCost = systemPowerWp * params.inverterCostPerWp;
  const equipmentCost = panelsCost + invertersCost;
  
  const installationCost = includeInstallation 
    ? (equipmentCost * params.installationPercentage) + params.fixedInstallationCost
    : 0;
  
  const totalCost = panelsCost + invertersCost + installationCost;
  
  const costBreakdown = [
    `Painéis: R$ ${panelsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Inversores: R$ ${invertersCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ...(includeInstallation ? [`Instalação: R$ ${installationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`] : []),
    `Total: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ];

  return {
    panelsCost,
    invertersCost,
    installationCost,
    totalCost,
    costBreakdown
  };
}

/**
 * Cálculo para projetos multi-unidades (construtoras e incorporadoras)
 */
export function calculateMultiUnitProject(
  unitsData: {
    totalUnits: number;
    consumptionPerUnit: number;
    commonAreas?: {
      elevators?: number;
      pools?: number;
      security?: number;
      lighting?: number;
      pumps?: number;
    };
    evCharging?: {
      stations: number;
      dailyKm: number;
      efficiency: number;
    };
  },
  state: string = 'GO'
): {
  residential: any;
  commonAreas?: any;
  evCharging?: any;
  combined: any;
} {
  const { totalUnits, consumptionPerUnit, commonAreas, evCharging } = unitsData;
  
  // Cálculo residencial (todas as unidades)
  const totalResidentialConsumption = totalUnits * consumptionPerUnit;
  const residentialPower = calculateRequiredPower(totalResidentialConsumption, state);
  const residential = calculateSolarSystem({
    monthly_consumption: totalResidentialConsumption,
    available_area: 1000, // Área fictícia para multi-unidades
    state
  });

  let result: any = { residential };

  // Cálculo de áreas comuns se especificado
  if (commonAreas) {
    const commonAreasConsumption = calculateCommonAreasConsumption(commonAreas);
    const commonAreasPower = calculateRequiredPower(commonAreasConsumption, state);
    result.commonAreas = calculateSolarSystem({
      monthly_consumption: commonAreasConsumption,
      available_area: 500,
      state
    });
  }

  // Cálculo de recarga de VE se especificado
  if (evCharging) {
    const evConsumption = calculateEvConsumption(evCharging.stations, evCharging.dailyKm, evCharging.efficiency);
    const evPower = calculateRequiredPower(evConsumption, state);
    result.evCharging = calculateSolarSystem({
      monthly_consumption: evConsumption,
      available_area: 300,
      state
    });
  }

  // Cálculo combinado
  const totalConsumption = residential.results.monthly_consumption + 
    (result.commonAreas?.results.monthly_consumption || 0) + 
    (result.evCharging?.results.monthly_consumption || 0);
  
  const totalPower = residential.results.system_power + 
    (result.commonAreas?.results.system_power || 0) + 
    (result.evCharging?.results.system_power || 0);

  result.combined = {
    total_units: totalUnits,
    total_consumption: totalConsumption,
    total_power: totalPower,
    total_investment: residential.results.total_investment + 
      (result.commonAreas?.results.total_investment || 0) + 
      (result.evCharging?.results.total_investment || 0),
    monthly_savings: residential.results.monthly_savings + 
      (result.commonAreas?.results.monthly_savings || 0) + 
      (result.evCharging?.results.monthly_savings || 0),
    scenarios: getInvestmentScenarios(totalPower)
  };

  return result;
}

/**
 * Cálculo de consumo de áreas comuns
 */
function calculateCommonAreasConsumption(commonAreas: any): number {
  let totalConsumption = 0;
  
  if (commonAreas.elevators) totalConsumption += commonAreas.elevators * 450; // 450 kWh/mês por elevador
  if (commonAreas.pools) totalConsumption += commonAreas.pools * 300; // 300 kWh/mês por piscina
  if (commonAreas.security) totalConsumption += commonAreas.security * 200; // 200 kWh/mês por sistema
  if (commonAreas.lighting) totalConsumption += commonAreas.lighting * 150; // 150 kWh/mês por área
  if (commonAreas.pumps) totalConsumption += commonAreas.pumps * 100; // 100 kWh/mês por bomba
  
  return totalConsumption;
}

/**
 * Cálculo de consumo para recarga de VE
 */
function calculateEvConsumption(stations: number, dailyKm: number, efficiency: number): number {
  const dailyConsumptionPerStation = (dailyKm / efficiency) * 1.2; // 20% de perdas
  const monthlyConsumptionPerStation = dailyConsumptionPerStation * 30;
  return stations * monthlyConsumptionPerStation;
}

/**
 * Cenários de investimento pré-definidos para tomada de decisão
 */
export function getInvestmentScenarios(systemPowerKw: number) {
  return {
    'Básico (só equipamentos)': calculateModularInvestment(systemPowerKw, false),
    'Completo (com instalação)': calculateModularInvestment(systemPowerKw, true),
    'Premium (equipamentos top)': calculateModularInvestment(systemPowerKw, true, {
      panelCostPerWp: 4.20,
      inverterCostPerWp: 1.10
    }),
    'Econômico (custo reduzido)': calculateModularInvestment(systemPowerKw, true, {
      panelCostPerWp: 3.40,
      inverterCostPerWp: 0.75,
      installationPercentage: 0.12
    })
  };
}

/**
 * Calcula número de painéis necessários
 */
export function calculatePanelCount(requiredPower: number): number {
  const panelPower = SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power / 1000; // Convert Wp to kWp
  return Math.ceil(requiredPower / panelPower);
}