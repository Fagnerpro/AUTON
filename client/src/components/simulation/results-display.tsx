import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafeTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-safe';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, AlertCircle, CheckCircle, Calculator, PiggyBank } from 'lucide-react';
import InvestmentScenarios from './investment-scenarios';
import type { Simulation } from '@shared/schema';

interface ResultsDisplayProps {
  type: string;
  results: any;
  simulation: Simulation;
}

export default function ResultsDisplay({ type, results, simulation }: ResultsDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 1) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getRecommendation = () => {
    const payback = results.financial_analysis?.payback_years;
    const roi = results.financial_analysis?.roi_25_years;
    
    if (payback <= 5 && roi >= 200) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'Projeto Altamente Viável',
        message: 'Excelente retorno sobre investimento. Recomendamos prosseguir com o projeto.'
      };
    } else if (payback <= 8 && roi >= 150) {
      return {
        icon: TrendingUp,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        title: 'Projeto Viável',
        message: 'Bom retorno financeiro. Projeto recomendado para implementação.'
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        title: 'Projeto Requer Análise',
        message: 'Retorno moderado. Recomendamos revisar os parâmetros ou considerar otimizações.'
      };
    }
  };

  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados da Simulação</h3>
        <p className="text-gray-600">Análise técnica e financeira do projeto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Results */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Especificações Técnicas</h4>
          
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Painéis</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {results.technical_specs?.panel_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Potência Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(results.technical_specs?.installed_power || 0)} kWp
                  </p>
                </div>
                
                {results.technical_specs?.used_area && (
                  <div>
                    <p className="text-sm text-gray-600">Área Necessária</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(results.technical_specs.used_area)} m²
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">
                    {type === 'ev_charging' ? 'Consumo Anual' : 'Geração Anual'}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber((results.technical_specs?.annual_generation || 0) / 1000)} MWh
                  </p>
                </div>

                {results.num_charging_points && (
                  <div>
                    <p className="text-sm text-gray-600">Pontos de Recarga</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {results.num_charging_points}
                    </p>
                  </div>
                )}

                {results.battery_capacity && (
                  <div>
                    <p className="text-sm text-gray-600">Capacidade Bateria</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(results.battery_capacity)} kWh
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {results.area_status && (
            <Alert className={`${
              results.area_sufficient 
                ? 'border-green-200 bg-green-50' 
                : 'border-orange-200 bg-orange-50'
            }`}>
              <Info className={`h-4 w-4 ${
                results.area_sufficient ? 'text-green-600' : 'text-orange-600'
              }`} />
              <AlertDescription className={
                results.area_sufficient ? 'text-green-700' : 'text-orange-700'
              }>
                <strong>Adequação da Área:</strong> {results.area_status}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Financial Results */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Análise Financeira</h4>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Investimento Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.financial_analysis?.total_investment || 0)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Economia Anual</p>
                    <p className="text-lg font-semibold text-green-700">
                      {formatCurrency(results.financial_analysis?.annual_savings || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payback</p>
                    <p className="text-lg font-semibold text-green-700">
                      {formatNumber(results.financial_analysis?.payback_years || 0)} anos
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">ROI (25 anos)</p>
                  <p className="text-lg font-semibold text-green-700">
                    {formatNumber(results.financial_analysis?.roi_25_years || 0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className={`${recommendation.bgColor} ${recommendation.borderColor}`}>
            <RecommendationIcon className={`h-5 w-5 ${recommendation.color}`} />
            <AlertDescription>
              <div>
                <p className={`font-medium ${recommendation.color}`}>
                  {recommendation.title}
                </p>
                <p className={`text-sm mt-1 ${recommendation.color.replace('600', '700')}`}>
                  {recommendation.message}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
