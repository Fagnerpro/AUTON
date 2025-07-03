import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InvestmentScenariosProps {
  scenarios: any;
}

export default function InvestmentScenarios({ scenarios }: InvestmentScenariosProps) {
  if (!scenarios) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
              {Object.entries(scenarios).map(([name, scenario]: [string, any]) => (
                <Card key={name} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{name}</CardTitle>
                      {getScenarioBadge(name)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(scenario.total_cost)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Payback: <span className="font-medium">{scenario.payback_years} anos</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scenario.cost_breakdown[0]}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="space-y-4">
            {Object.entries(scenarios).map(([name, scenario]: [string, any]) => (
              <Card key={name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{name}</CardTitle>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(scenario.total_cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        Payback: {scenario.payback_years} anos
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {scenario.cost_breakdown.map((breakdown: string, index: number) => (
                      <div key={index} className="text-sm font-mono">
                        {breakdown}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}