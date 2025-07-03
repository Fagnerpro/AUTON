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

  // Parâmetros financeiros
  FINANCIAL: {
    tariff_kwh: 0.75,           // Tarifa média kWh R$
    annual_increase: 0.08,      // Aumento anual da tarifa 8%
    installation_cost_per_wp: 4.50, // Custo por Wp instalado R$
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
 */
export function calculateRequiredPower(monthlyConsumption: number, state: string): number {
  const irradiation = getSolarIrradiation(state);
  const efficiency = SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
  
  // CORREÇÃO: A irradiação é por dia, então precisamos multiplicar por 30 dias
  // Potência necessária = Consumo mensal / (Irradiação × 30 dias × Eficiência)
  const monthlyIrradiation = irradiation * 30; // kWh/m²/mês
  
  // Para calcular a potência, usamos: kWp = kWh_consumo / (irradiação_mensal × eficiência)
  return monthlyConsumption / (monthlyIrradiation * efficiency);
}

/**
 * Calcula número de painéis necessários
 */
export function calculatePanelCount(requiredPower: number): number {
  const panelPower = SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power / 1000; // Convert Wp to kWp
  return Math.ceil(requiredPower / panelPower);
}