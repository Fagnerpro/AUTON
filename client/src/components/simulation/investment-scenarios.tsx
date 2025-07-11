import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InvestmentScenariosProps {
  scenarios: any;
  results?: any;
  simulationType?: string;
}

export default function InvestmentScenarios({ scenarios, results, simulationType }: InvestmentScenariosProps) {
  // Gerar cenários baseados nos dados reais da simulação
  const generateScenarios = () => {
    const baseInvestment = results?.totalInvestment || 150000;
    const baseSavings = results?.annualSavings || 9600;
    const basePayback = results?.paybackYears || 15.6;
    const baseROI = results?.roi_percentage || 8.5;

    return {
      'Básico (só equipamentos)': {
        name: 'Básico (só equipamentos)',
        total_investment: Math.round(baseInvestment * 0.85),
        monthly_savings: Math.round(baseSavings * 0.9 / 12),
        payback_years: basePayback * 1.1,
        roi_percentage: baseROI * 0.9,
        description: 'Equipamentos básicos sem instalação'
      },
      'Completo (com instalação)': {
        name: 'Completo (com instalação)',
        total_investment: baseInvestment,
        monthly_savings: Math.round(baseSavings / 12),
        payback_years: basePayback,
        roi_percentage: baseROI,
        description: 'Sistema completo com instalação profissional'
      },
      'Premium (equipamentos top)': {
        name: 'Premium (equipamentos top)',
        total_investment: Math.round(baseInvestment * 1.2),
        monthly_savings: Math.round(baseSavings * 1.15 / 12),
        payback_years: basePayback * 1.05,
        roi_percentage: baseROI * 1.1,
        description: 'Equipamentos premium com maior eficiência'
      }
    };
  };

  // Usar cenários fornecidos ou gerar baseados nos dados reais
  const finalScenarios = scenarios && typeof scenarios === 'object' && Object.keys(scenarios).length > 0 
    ? scenarios 
    : generateScenarios();

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getScenarioBadge = (scenarioName: string) => {
    switch (scenarioName) {
      case 'Básico (só equipamentos)':
        return <Badge variant="secondary">Mínimo</Badge>;
      case 'Completo (com instalação)':
        return <Badge variant="default">Recomendado</Badge>;
      case 'Premium (equipamentos top)':
        return <Badge variant="destructive">Premium</Badge>;
      case 'Econômico (custo reduzido)':
        return <Badge variant="outline">Econômico</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Cenários de Investimento
          <Badge variant="outline">Modular</Badge>
        </CardTitle>
        <CardDescription>
          Compare diferentes opções de investimento baseadas no seu orçamento disponível
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Comparação</TabsTrigger>
            <TabsTrigger value="breakdown">Detalhamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(finalScenarios).map(([name, scenario]: [string, any]) => {
                // Verificação de segurança para cada cenário
                if (!scenario || typeof scenario !== 'object') return null;
                
                return (
                  <Card key={name} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{name}</CardTitle>
                        {getScenarioBadge(name)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(scenario.total_cost || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Payback: <span className="font-medium">{scenario.payback_years || 'N/A'} anos</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scenario.cost_breakdown && Array.isArray(scenario.cost_breakdown) && scenario.cost_breakdown.length > 0 
                          ? scenario.cost_breakdown[0] 
                          : 'Detalhes do investimento'
                        }
                      </div>
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)}
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="space-y-4">
            {Object.entries(finalScenarios).map(([name, scenario]: [string, any]) => {
              // Verificação de segurança para cada cenário
              if (!scenario || typeof scenario !== 'object') return null;
              
              return (
                <Card key={name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{name}</CardTitle>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatCurrency(scenario.total_cost || 0)}</div>
                        <div className="text-sm text-muted-foreground">
                          Payback: {scenario.payback_years || 'N/A'} anos
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {scenario.cost_breakdown && Array.isArray(scenario.cost_breakdown) && scenario.cost_breakdown.length > 0 
                        ? scenario.cost_breakdown.map((breakdown: string, index: number) => (
                            <div key={index} className="text-sm font-mono">
                              {breakdown}
                            </div>
                          ))
                        : <div className="text-sm text-muted-foreground">Detalhes não disponíveis</div>
                      }
                    </div>
                  </CardContent>
                </Card>
              );
            }).filter(Boolean)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}