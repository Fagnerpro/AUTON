import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Car, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import type { Simulation } from '@shared/schema';

export default function RecentSimulations() {
  const { data: simulations, isLoading } = useQuery({
    queryKey: ['/api/simulations'],
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      calculated: 'default',
      draft: 'secondary',
      approved: 'default'
    } as const;
    
    const labels = {
      completed: 'Concluído',
      calculated: 'Calculado',
      draft: 'Rascunho',
      approved: 'Aprovado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      residential: Building,
      commercial: Building,
      ev_charging: Car,
      common_areas: Zap
    };
    
    const Icon = icons[type as keyof typeof icons] || Building;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      residential: 'bg-orange-100 text-solar-orange',
      commercial: 'bg-blue-100 text-solar-blue',
      ev_charging: 'bg-green-100 text-solar-green',
      common_areas: 'bg-purple-100 text-purple-600'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simulações Recentes</CardTitle>
          <CardDescription>
            Últimas simulações criadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentSimulations = simulations?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulações Recentes</CardTitle>
        <CardDescription>
          Últimas simulações criadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSimulations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nenhuma simulação encontrada</p>
            <Link href="/simulation">
              <Button className="bg-solar-orange hover:bg-orange-600">
                Criar primeira simulação
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSimulations.map((simulation: Simulation) => {
              const results = simulation.results as any;
              const savings = results?.annualSavings || results?.annual_savings || 0;
              const power = (results?.systemPower || results?.total_power || 0) / 1000; // Converter W para kW
              
              return (
                <div key={simulation.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(simulation.type)}`}>
                      {getTypeIcon(simulation.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {simulation.name || `Simulação ${simulation.type === 'residential' ? 'Residencial' : simulation.type === 'commercial' ? 'Comercial' : simulation.type === 'ev_charging' ? 'Recarga VE' : 'Áreas Comuns'}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {power > 0 && `${power.toFixed(1)} kWp`}
                        {power > 0 && savings > 0 && ' • '}
                        {savings > 0 && `${formatCurrency(savings)} economia/ano`}
                        {(!power && !savings) && simulation.address && `${simulation.address}, ${simulation.city || ''}`}
                        {(!power && !savings && !simulation.address) && 'Aguardando configuração'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(simulation.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(simulation.createdAt)}
                      </span>
                    </div>
                    <Link href={`/simulation/${simulation.id}`}>
                      <Button variant="outline" size="sm" className="w-full md:w-auto">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
