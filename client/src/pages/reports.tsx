import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation } from '@shared/schema';

export default function Reports() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const { toast } = useToast();

  // Fetch user simulations
  const { data: simulations = [], isLoading } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { simulationId: number; format: string }) => {
      return apiRequest('POST', `/api/reports/generate`, data);
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-simulacao-${selectedSimulation}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Relatório gerado",
        description: "Download iniciado com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório.",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedSimulation) {
      toast({
        variant: "destructive",
        title: "Seleção necessária",
        description: "Selecione uma simulação para gerar o relatório.",
      });
      return;
    }

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      calculated: 'default',
      approved: 'default',
      completed: 'default'
    };
    
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      calculated: 'Calculada',
      approved: 'Aprovada',
      completed: 'Concluída'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeName = (type: string) => {
    const types = {
      residential: 'Residencial',
      commercial: 'Comercial',
      ev_charging: 'Recarga de VE',
      common_areas: 'Áreas Comuns'
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">
          Gere relatórios detalhados das suas simulações em diferentes formatos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Gerador de Relatórios</span>
            </CardTitle>
            <CardDescription>
              Selecione uma simulação e o formato desejado para gerar seu relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Simulação</label>
              <Select value={selectedSimulation} onValueChange={setSelectedSimulation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma simulação" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(simulations) && simulations.map((sim: Simulation) => (
                    <SelectItem key={sim.id} value={sim.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{sim.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {getTypeName(sim.type)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Formato</label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF - Documento completo</SelectItem>
                  <SelectItem value="excel">Excel - Planilha com dados</SelectItem>
                  <SelectItem value="json">JSON - Dados estruturados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateReport}
              disabled={!selectedSimulation || generateReportMutation.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {generateReportMutation.isPending ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </CardContent>
        </Card>

        {/* Simulation List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Simulações Disponíveis</span>
            </CardTitle>
            <CardDescription>
              Lista das suas simulações calculadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(simulations) && simulations
                .filter((sim: Simulation) => sim.status === 'calculated' || sim.status === 'completed')
                .map((sim: Simulation) => (
                  <div key={sim.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{sim.name}</h4>
                      {getStatusBadge(sim.status)}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Tipo: {getTypeName(sim.type)}</div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              {Array.isArray(simulations) && simulations
                .filter((sim: Simulation) => sim.status === 'calculated' || sim.status === 'completed')
                .length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhuma simulação calculada encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tipos de Relatório</CardTitle>
          <CardDescription>
            Conheça os diferentes formatos de relatório disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">PDF Completo</h4>
              <p className="text-sm text-gray-600">
                Relatório técnico e financeiro detalhado com gráficos, especificações técnicas e análise de viabilidade.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Planilha Excel</h4>
              <p className="text-sm text-gray-600">
                Dados estruturados em planilha para análises personalizadas e comparações.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">JSON Técnico</h4>
              <p className="text-sm text-gray-600">
                Dados estruturados para integração com outros sistemas e análises programáticas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}