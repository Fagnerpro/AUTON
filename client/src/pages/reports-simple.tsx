import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Code
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation } from '@shared/schema';

export default function ReportsSimple() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const { toast } = useToast();

  // Fetch user simulations
  const { data: simulations = [], isLoading, error } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { 
      simulationId: number; 
      format: string; 
    }) => {
      return apiRequest('POST', `/api/reports/generate`, data, { responseType: 'blob' });
    },
    onSuccess: async (response) => {
      try {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-completo-${selectedSimulation}.${reportFormat}`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          try {
            if (a.parentNode) {
              a.parentNode.removeChild(a);
            }
            window.URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 100);
        
        toast({
          title: "✅ Relatório gerado com sucesso!",
          description: `Download do arquivo ${reportFormat.toUpperCase()} iniciado.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no download",
          description: "Erro ao processar o arquivo.",
        });
      }
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
        title: "⚠️ Simulação necessária",
        description: "Selecione uma simulação para gerar o relatório.",
      });
      return;
    }

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'excel': return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'json': return <Code className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getSimulationBadge = (simulation: Simulation) => {
    if (!simulation.results) return <Badge variant="outline">Sem cálculo</Badge>;
    
    const payback = (simulation.results as any)?.payback_years;
    if (payback <= 5) return <Badge className="bg-green-100 text-green-800">Viável</Badge>;
    if (payback <= 8) return <Badge className="bg-amber-100 text-amber-800">Moderado</Badge>;
    return <Badge className="bg-orange-100 text-orange-800">Avaliar</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar simulações. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Gere relatórios completos das suas simulações solares
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção da Simulação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Selecionar Simulação
            </CardTitle>
            <CardDescription>
              Escolha a simulação para gerar o relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select 
              value={selectedSimulation} 
              onChange={(e) => setSelectedSimulation(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione uma simulação...</option>
              {simulations.length > 0 ? (
                simulations.map((simulation) => (
                  <option 
                    key={simulation.id} 
                    value={simulation.id.toString()}
                  >
                    {simulation.name || `Simulação ${simulation.id}`}
                  </option>
                ))
              ) : (
                <option value="empty" disabled>
                  Nenhuma simulação encontrada
                </option>
              )}
            </select>

            {selectedSimulation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                {(() => {
                  const sim = simulations.find(s => s.id.toString() === selectedSimulation);
                  return sim ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sim.name}</span>
                        {getSimulationBadge(sim)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Tipo: {sim.type} • Criado em: {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formato do Relatório */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Formato do Relatório
            </CardTitle>
            <CardDescription>
              Escolha o formato de saída do relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pdf', label: 'PDF', desc: 'Apresentação' },
                { value: 'excel', label: 'Excel', desc: 'Dados' },
                { value: 'json', label: 'JSON', desc: 'API' }
              ].map((format) => (
                <Button
                  key={format.value}
                  variant={reportFormat === format.value ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                  onClick={() => setReportFormat(format.value)}
                >
                  {getFormatIcon(format.value)}
                  <span className="text-xs font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.desc}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Gerar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">🚀 Pronto para gerar!</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSimulation ? 
                  `Relatório ${reportFormat.toUpperCase()} será gerado com dados completos da simulação` :
                  'Selecione uma simulação para continuar'
                }
              </p>
            </div>
            <Button 
              onClick={handleGenerateReport}
              disabled={!selectedSimulation || generateReportMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {generateReportMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Simulações */}
      {simulations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suas Simulações</CardTitle>
            <CardDescription>
              Lista completa das simulações disponíveis para relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {simulations.map((simulation) => (
                <div 
                  key={simulation.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSimulation === simulation.id.toString() 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSimulation(simulation.id.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{simulation.name}</div>
                      <div className="text-sm text-gray-600">
                        {simulation.type} • {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSimulationBadge(simulation)}
                      {simulation.results && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}