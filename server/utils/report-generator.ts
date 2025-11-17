/**
 * Report Generation Utilities
 * Generates PDF, Excel (CSV), and JSON reports for simulations
 */

export async function generateReport(simulation: any, format: string): Promise<Buffer | string> {
  const results = simulation.results;
  
  if (format === 'json') {
    return JSON.stringify({
      simulation: {
        id: simulation.id,
        name: simulation.name,
        type: simulation.type,
        created: simulation.createdAt,
        status: simulation.status,
        total_units: simulation.totalUnits || 1
      },
      parameters: simulation.parameters,
      results: results,
      generated_at: new Date().toISOString()
    }, null, 2);
  }
  
  if (format === 'excel') {
    const totalUnits = simulation.totalUnits || 1;
    const projectInfo = results.project_info;
    
    let csvData = [
      ['Relatório de Simulação Solar AUTON®', ''],
      ['Nome do Projeto', simulation.name],
      ['Tipo', simulation.type],
      ['Data de Criação', new Date(simulation.createdAt).toLocaleDateString('pt-BR')],
      ['', ''],
      ['Informações do Projeto', ''],
      ['Número Total de Unidades', totalUnits],
      ...(projectInfo ? [
        ['Investimento por Unidade (R$)', projectInfo.unit_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
        ['Economia Mensal por Unidade (R$)', projectInfo.unit_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0]
      ] : []),
      ['', '']
    ];

    if (simulation.type === 'ev_charging') {
      csvData = csvData.concat([
        ['Especificações de Recarga Veicular', ''],
        ['Pontos de Recarga', results.num_charging_points || 0],
        ['Consumo Diário (kWh)', results.daily_consumption?.toFixed(2) || 0],
        ['Capacidade de Bateria (kWh)', results.battery_capacity?.toFixed(2) || 0],
        ['Receita de Recarga (R$/kWh)', results.charging_revenue?.toFixed(2) || 0],
        ['', '']
      ]);
    }

    csvData = csvData.concat([
      ['Especificações Técnicas Totais', ''],
      ['Potência Instalada Total (kWp)', (results.system_power || results.total_power || 0) / 1000],
      ['Número Total de Painéis', results.num_panels || results.panelCount || 0],
      ['Geração Mensal Total (kWh)', results.monthly_generation?.toFixed(0) || results.monthlyGeneration?.toFixed(0) || 0],
      ['Geração Anual Total (kWh)', results.annual_generation?.toFixed(0) || results.annualGeneration?.toFixed(0) || 0],
      ['Área Total Necessária (m²)', results.required_area?.toFixed(2) || results.usedArea?.toFixed(2) || 0],
      ['Cobertura do Consumo (%)', results.coverage_percentage?.toFixed(1) || results.coveragePercentage?.toFixed(1) || 0],
      ['', ''],
      ['Análise Financeira Total', ''],
      ['Investimento Total (R$)', results.total_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || results.totalInvestment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
      ['Economia Mensal Total (R$)', results.monthly_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || (results.annualSavings/12)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
      ['Economia Anual Total (R$)', (results.annual_savings || results.annualSavings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Payback (anos)', (results.payback_years || results.paybackYears || 0).toFixed(1)],
      ['ROI 25 anos (%)', (results.roi_percentage || results.roi || 0).toFixed(1)],
      ['', ''],
      ['Observações', ''],
      ['Sistema calculado para ' + totalUnits + (totalUnits > 1 ? ' unidades' : ' unidade'), ''],
      ['Valores já incluem multiplicação por número de unidades', ''],
      ['Relatório gerado pelo AUTON® em ' + new Date().toLocaleString('pt-BR'), '']
    ]);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return Buffer.from('\uFEFF' + csvContent, 'utf-8');
  }
  
  // PDF format
  const totalUnits = simulation.totalUnits || 1;
  const projectInfo = results.project_info;
  
  let pdfContent = `RELATÓRIO DE SIMULAÇÃO SOLAR AUTON®
========================================

INFORMAÇÕES DO PROJETO
----------------------
Projeto: ${simulation.name}
Tipo: ${simulation.type}
Data: ${new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
Número de Unidades: ${totalUnits}
Status: ${simulation.status}

${projectInfo ? `
VALORES POR UNIDADE
-------------------
Investimento por Unidade: R$ ${projectInfo.unit_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}
Economia Mensal por Unidade: R$ ${projectInfo.unit_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}
` : ''}`;

  if (simulation.type === 'ev_charging') {
    pdfContent += `

ESPECIFICAÇÕES DE RECARGA VEICULAR
----------------------------------
Pontos de Recarga: ${results.num_charging_points || 0}
Consumo Diário: ${results.daily_consumption?.toFixed(2) || 0} kWh
Consumo Anual: ${results.annual_consumption?.toFixed(0) || 0} kWh
Capacidade de Bateria: ${results.battery_capacity?.toFixed(2) || 0} kWh
Receita de Recarga: R$ ${results.charging_revenue?.toFixed(2) || 0}/kWh`;
  }

  pdfContent += `

ESPECIFICAÇÕES TÉCNICAS TOTAIS
------------------------------
Potência Total Instalada: ${((results.system_power || results.total_power || 0) / 1000).toFixed(2)} kWp
Número Total de Painéis: ${results.num_panels || results.panelCount || 0}
Geração Mensal Total: ${(results.monthly_generation || results.monthlyGeneration || 0).toLocaleString('pt-BR')} kWh
Geração Anual Total: ${(results.annual_generation || results.annualGeneration || 0).toLocaleString('pt-BR')} kWh
Área Total Necessária: ${(results.required_area || results.usedArea || 0).toFixed(2)} m²
Cobertura do Consumo: ${(results.coverage_percentage || results.coveragePercentage || 0).toFixed(1)}%

ANÁLISE FINANCEIRA TOTAL
------------------------
Investimento Total: R$ ${(results.total_investment || results.totalInvestment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Economia Mensal: R$ ${(results.monthly_savings || (results.annualSavings/12) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Economia Anual: R$ ${(results.annual_savings || results.annualSavings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Payback: ${(results.payback_years || results.paybackYears || 0).toFixed(1)} anos
ROI (25 anos): ${(results.roi_percentage || results.roi || 0).toFixed(1)}%

IMPACTO AMBIENTAL
-----------------
CO2 evitado anualmente: ${(results.co2_reduction || results.environmental_impact?.co2_avoided_annually || 0).toFixed(0)} kg
Equivalente em árvores: ${Math.round((results.co2_reduction || 0) / 22) || 0}

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;
  
  return Buffer.from(pdfContent, 'utf-8');
}
