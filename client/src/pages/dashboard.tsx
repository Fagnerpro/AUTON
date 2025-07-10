import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Crown, AlertTriangle, Calculator, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import StatsCards from '@/components/dashboard/stats-cards';
import Charts from '@/components/dashboard/charts';
import RecentSimulations from '@/components/dashboard/recent-simulations';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: planAccess } = useQuery({
    queryKey: ['/api/users/plan-access'],
    enabled: !!user,
  });

  const handleNewSimulation = () => {
    if (planAccess && !planAccess.hasAccess) {
      setLocation('/upgrade');
    } else {
      setLocation('/simulation');
    }
  };

  return (
    <div className="space-y-8">
      {/* Plan Alerts */}
      {user && planAccess && (
        <>
          {user.plan === 'demo' && planAccess.remainingSimulations === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <Crown className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Limite de Demo Atingido</AlertTitle>
              <AlertDescription className="text-orange-700 flex items-center justify-between">
                <span>
                  Você atingiu o limite de 1 simulação do plano demo. 
                  <Link href="/upgrade">
                    <Button variant="link" className="p-0 text-orange-600 underline ml-1">
                      Faça upgrade para Premium
                    </Button>
                  </Link>
                  {' '}para acesso ilimitado.
                </span>
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    <Calculator className="w-4 h-4 mr-2" />
                    Ver Calculadora de Preços
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
          
          {user.plan === 'demo' && planAccess.remainingSimulations > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Plano Demo</AlertTitle>
              <AlertDescription className="text-blue-700">
                Você tem {planAccess.remainingSimulations} simulação restante no plano demo. 
                Considere fazer upgrade para acesso ilimitado.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas simulações e projetos solares
          </p>
        </div>
        <Button 
          onClick={handleNewSimulation}
          className="bg-solar-orange hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Simulação
        </Button>
      </div>

      {/* AI Advisor Promotion */}
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <Brain className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-800 flex items-center space-x-2">
          <span>🆕 Novo: Assistente Solar IA</span>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">BETA</Badge>
        </AlertTitle>
        <AlertDescription className="text-purple-700 flex items-center justify-between">
          <span>
            Receba orientações personalizadas e insights inteligentes sobre seus projetos solares. 
            O assistente IA analisa suas simulações e fornece recomendações técnicas e financeiras.
          </span>
          <Link href="/ai-advisor">
            <Button variant="outline" size="sm" className="border-purple-600 text-purple-600 hover:bg-purple-50">
              <Brain className="w-4 h-4 mr-2" />
              Experimentar IA
            </Button>
          </Link>
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts */}
      <Charts />

      {/* Recent Simulations */}
      <RecentSimulations />
    </div>
  );
}
