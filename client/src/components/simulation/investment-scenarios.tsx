import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InvestmentScenariosProps {
  scenarios: any;
}

export default function InvestmentScenarios({ scenarios }: InvestmentScenariosProps) {
  // Verificações de segurança mais robustas
  if (!scenarios || typeof scenarios !== 'object' || Object.keys(scenarios).length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>💰 Cenários de Investimento</CardTitle>
          <CardDescription>
            Cenários não disponíveis para este tipo de simulação
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
              {Object.entries(scenarios).map(([name, scenario]: [string, any]) => {
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
            {Object.entries(scenarios).map(([name, scenario]: [string, any]) => {
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