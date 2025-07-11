import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  TrendingUp, 
  AlertCircle, 
  Calculator, 
  PiggyBank, 
  Zap,
  Home,
  Leaf,
  BarChart3
} from 'lucide-react';
import InvestmentScenarios from './investment-scenarios';
import type { Simulation } from '@shared/schema';

interface ResultsDisplayProps {
  type: string;
  results: any;
  simulation: Simulation;
}

export default function ResultsDisplayEnhanced({ type, results, simulation }: ResultsDisplayProps) {
  // Debug para verificar estrutura dos dados
  console.log('ResultsDisplayEnhanced - dados recebidos:', { type, results, simulation });
  console.log('Technical specs:', results.technical_specs);
  console.log('Financial analysis:', results.financial_analysis);
  console.log('Environmental impact:', results.environmental_impact);
  
  const formatCurrency = (value: number, decimals: number = 2) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
    
    // Para valores grandes (milhões), sempre mostrar 2 casas decimais
    // Para valores menores, usar formatação padrão
    const adjustedDecimals = value >= 1000000 ? 2 : decimals;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: adjustedDecimals,
      maximumFractionDigits: adjustedDecimals,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 0) => {
    if (!value || isNaN(value)) return '0';
    
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // Estrutura correta dos dados vindos do backend
  const technicalSpecs = {
    installed_power: results.technical_specs?.installed_power || results.system_power || results.total_power,
    panel_count: results.technical_specs?.panel_count || results.num_panels || results.panel_count,
    monthly_generation: results.technical_specs?.monthly_generation || results.monthly_generation,
    annual_generation: results.technical_specs?.annual_generation || results.annual_generation,
    used_area: results.technical_specs?.used_area || results.required_area || results.used_area,
    coverage_percentage: results.technical_specs?.coverage_percentage || results.coverage_percentage,
    irradiation: results.technical_specs?.irradiation || results.irradiation || 5.8,
    system_efficiency: results.technical_specs?.system_efficiency || results.system_efficiency || 0.78
  };
  
  console.log('Mapped technicalSpecs:', technicalSpecs);
  
  const financialAnalysis = {
    total_investment: results.financial_analysis?.total_investment || results.total_investment,
    monthly_savings: results.financial_analysis?.monthly_savings || results.monthly_savings,
    annual_savings: results.financial_analysis?.annual_savings || results.annual_savings,
    payback_years: results.financial_analysis?.payback_years || results.payback_years,
    roi_25_years: results.financial_analysis?.roi_25_years || results.roi_percentage,
    net_profit_25_years: results.financial_analysis?.net_profit_25_years || 0,
    total_savings_25_years: results.financial_analysis?.total_savings_25_years || 0,
    investment_scenarios: results.financial_analysis?.investment_scenarios || {}
  };
  
  console.log('Mapped financialAnalysis:', financialAnalysis);
  
  const environmentalImpact = {
    co2_avoided_annually: results.environmental_impact?.co2_avoided_annually ? (results.environmental_impact.co2_avoided_annually / 1000) : 0,
    trees_equivalent: results.environmental_impact?.trees_equivalent || 0,
    oil_saved_annually: (technicalSpecs.annual_generation || 0) * 0.00043 // barris de petróleo
  };

  // Informações sobre múltiplas unidades
  const projectInfo = results.project_info;
  const totalUnits = simulation.totalUnits || 1;

  const getViabilityBadge = () => {
    const payback = financialAnalysis?.payback_years;
    if (payback <= 5) return <Badge className="bg-green-100 text-green-800">Altamente Viável</Badge>;
    if (payback <= 8) return <Badge className="bg-amber-100 text-amber-800">Viável</Badge>;
    return <Badge className="bg-orange-100 text-orange-800">Avaliar</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-green-800">✅ Sistema Solar Dimensionado</CardTitle>
                <p className="text-sm text-green-600 mt-1">
                  Simulação tipo: <span className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </p>
              </div>
            </div>
            {getViabilityBadge()}
          </div>
        </CardHeader>
      </Card>

      {/* Informações Multi-Unidades */}
      {totalUnits > 1 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Home className="h-5 w-5" />
              🏢 Projeto Multi-Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <p className="text-2xl font-bold text-orange-600">{totalUnits}</p>
                <p className="text-sm text-gray-600">Unidades Totais</p>
              </div>
              
              {projectInfo && (
                <>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(projectInfo.unit_investment || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Por Unidade</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(projectInfo.unit_savings || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Economia/Mês por Unidade</p>
                  </div>
                </>
              )}
            </div>
            
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Valores Totais:</strong> Todos os cálculos apresentados já incluem a multiplicação por {totalUnits} unidades. 
                O sistema foi dimensionado considerando o consumo agregado de todas as unidades.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {technicalSpecs?.panel_count || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Painéis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {technicalSpecs?.installed_power ? `${technicalSpecs.installed_power.toFixed(1)}` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">kWp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {financialAnalysis?.payback_years ? `${financialAnalysis.payback_years}` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">anos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Home className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {technicalSpecs?.coverage_percentage ? `${technicalSpecs.coverage_percentage}%` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Cobertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Organizadas */}
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            💰 Cenários
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            📈 Financeiro
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            ⚙️ Técnico
          </TabsTrigger>
          <TabsTrigger value="environmental" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            🌱 Ambiental
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cenários de Investimento */}
        <TabsContent value="scenarios" className="space-y-4">
          {financialAnalysis?.investment_scenarios ? (
            <InvestmentScenarios scenarios={financialAnalysis.investment_scenarios} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cenários de investimento não disponíveis. Execute o cálculo para visualizar as opções.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab: Análise Financeira */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Análise de Retorno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialAnalysis?.total_investment || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Investimento Total</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialAnalysis?.annual_savings || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Economia Anual</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso de Payback</span>
                    <span>{financialAnalysis?.payback_years || 0} anos</span>
                  </div>
                  <Progress 
                    value={Math.min((financialAnalysis?.payback_years || 0) / 10 * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💎 Ganhos de 25 Anos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI Total:</span>
                  <span className="font-bold text-green-600">
                    {financialAnalysis?.roi_25_years || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Economia Total:</span>
                  <span className="font-bold">
                    {formatCurrency(financialAnalysis?.total_savings_25_years || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lucro Líquido:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(financialAnalysis?.net_profit_25_years || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Especificações Técnicas */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Especificações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Painéis Solares</p>
                  <p className="text-xl font-bold">{technicalSpecs?.panel_count || 'N/A'} unidades</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Potência Instalada</p>
                  <p className="text-xl font-bold">
                    {technicalSpecs?.installed_power ? `${technicalSpecs.installed_power.toFixed(2)} kWp` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Área Utilizada</p>
                  <p className="text-xl font-bold">
                    {technicalSpecs?.used_area ? `${technicalSpecs.used_area.toFixed(1)} m²` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Geração Mensal</p>
                  <p className="text-xl font-bold">
                    {technicalSpecs?.monthly_generation ? `${formatNumber(technicalSpecs.monthly_generation)} kWh` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Irradiação Solar</p>
                  <p className="text-xl font-bold">
                    {technicalSpecs?.irradiation ? `${technicalSpecs.irradiation} kWh/m²/dia` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Eficiência</p>
                  <p className="text-xl font-bold">
                    {technicalSpecs?.system_efficiency ? `${(technicalSpecs.system_efficiency * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Impacto Ambiental */}
        <TabsContent value="environmental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                🌱 Benefícios Ambientais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <Leaf className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(environmentalImpact?.co2_avoided_annually || 0)}
                  </p>
                  <p className="text-sm text-green-700 font-medium">kg CO₂ evitados/ano</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <Home className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-blue-600">
                    {environmentalImpact?.trees_equivalent || 0}
                  </p>
                  <p className="text-sm text-blue-700 font-medium">árvores equivalentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}