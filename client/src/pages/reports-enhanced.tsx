import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  BarChart3, 
  PiggyBank,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Code,
  Settings
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation } from '@shared/schema';

export default function ReportsEnhanced() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [includeScenarios, setIncludeScenarios] = useState<boolean>(true);
  const [includeTechnical, setIncludeTechnical] = useState<boolean>(true);
  const [includeFinancial, setIncludeFinancial] = useState<boolean>(true);
  const [includeEnvironmental, setIncludeEnvironmental] = useState<boolean>(true);
  const { toast } = useToast();

  // Fetch user simulations
  const { data: simulations = [], isLoading } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  // Generate enhanced report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { 
      simulationId: number; 
      format: string; 
      includeScenarios?: boolean;
      sections?: string[];
    }) => {
      return apiRequest('POST', `/api/reports/generate`, data);
    },
    onSuccess: async (response) => {
      try {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-completo-${selectedSimulation}.${reportFormat}`;
        a.style.display = 'none';
        
        if (!document.body.contains(a)) {
          document.body.appendChild(a);
        }
        
        a.click();
        
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          window.URL.revokeObjectURL(url);
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

    const sections = [];
    if (includeTechnical) sections.push('technical');
    if (includeFinancial) sections.push('financial');
    if (includeEnvironmental) sections.push('environmental');

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
      includeScenarios,
      sections
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
    
    const payback = simulation.results?.financial_analysis?.payback_years;
    if (payback <= 5) return <Badge className="bg-green-100 text-green-800">Viável</Badge>;
    if (payback <= 8) return <Badge className="bg-amber-100 text-amber-800">Moderado</Badge>;
    return <Badge className="bg-orange-100 text-orange-800">Avaliar</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios Avançados</h1>
          <p className="text-gray-600 mt-2">
            Gere relatórios detalhados com cenários de investimento e análises completas
          </p>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gerador de Relatórios
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualização
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerador */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção da Simulação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  1️⃣ Selecionar Simulação
                </CardTitle>
                <CardDescription>
                  Escolha a simulação para gerar o relatório
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedSimulation} onValueChange={setSelectedSimulation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma simulação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {simulations.map((simulation) => (
                      <SelectItem key={simulation.id} value={simulation.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{simulation.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

            {/* Formato e Opções */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  2️⃣ Formato & Opções
                </CardTitle>
                <CardDescription>
                  Configure o tipo de relatório e conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Formato do Arquivo</label>
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-purple-600" />
                3️⃣ Conteúdo do Relatório
              </CardTitle>
              <CardDescription>
                Selecione as seções que deseja incluir no relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">📊 Análises Principais</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scenarios"
                      checked={includeScenarios}
                      onCheckedChange={(checked) => setIncludeScenarios(checked === true)}
                    />
                    <label htmlFor="scenarios" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      💰 Cenários de Investimento
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="financial"
                      checked={includeFinancial}
                      onCheckedChange={(checked) => setIncludeFinancial(checked === true)}
                    />
                    <label htmlFor="financial" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      📈 Análise Financeira Completa
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">⚙️ Especificações</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="technical"
                      checked={includeTechnical}
                      onCheckedChange={(checked) => setIncludeTechnical(checked === true)}
                    />
                    <label htmlFor="technical" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      🔧 Detalhes Técnicos
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="environmental"
                      checked={includeEnvironmental}
                      onCheckedChange={(checked) => setIncludeEnvironmental(checked === true)}
                    />
                    <label htmlFor="environmental" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      🌱 Impacto Ambiental
                    </label>
                  </div>
                </div>
              </div>

              {includeScenarios && (
                <Alert className="mt-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    <strong>Cenários Incluídos:</strong> Básico, Completo, Premium e Econômico com análise comparativa de payback.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Botão de Gerar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">🚀 Pronto para gerar!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSimulation ? 
                      `Relatório ${reportFormat.toUpperCase()} será gerado com ${includeScenarios ? 'cenários de investimento' : 'análise padrão'}` :
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
        </TabsContent>

        {/* Tab: Visualização */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>👁️ Prévia do Relatório</CardTitle>
              <CardDescription>
                Visualize como será o conteúdo do seu relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSimulation ? (
                <div className="space-y-4">
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      Funcionalidade de prévia em desenvolvimento. O relatório será gerado conforme as opções selecionadas.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Selecione uma simulação para visualizar a prévia
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}