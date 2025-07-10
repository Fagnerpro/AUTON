import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TypeSelector from '@/components/simulation/type-selector';
import BasicForm from '@/components/simulation/basic-form';
import SpecificConfig from '@/components/simulation/specific-config';
import ResultsDisplayEnhanced from '@/components/simulation/results-display-enhanced';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Simulation, InsertSimulation } from '@shared/schema';

export default function SimulationForm() {
  const [, params] = useRoute('/simulation/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('form');
  const [simulationType, setSimulationType] = useState('residential');
  const [formData, setFormData] = useState<Partial<InsertSimulation>>({
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'GO',
    type: 'residential',
    parameters: {},
    status: 'draft',
  });

  const simulationId = params?.id ? parseInt(params.id) : null;

  // Check plan access
  const { data: planAccess } = useQuery({
    queryKey: ['/api/users/plan-access'],
    enabled: !!user,
  });

  // Fetch existing simulation if editing
  const { data: simulation, isLoading } = useQuery({
    queryKey: ['/api/simulations', simulationId],
    enabled: !!simulationId,
  });

  // Redirect to upgrade if no access and not editing existing
  useEffect(() => {
    if (planAccess && !planAccess.hasAccess && !simulationId) {
      setLocation('/upgrade');
    }
  }, [planAccess, simulationId, setLocation]);

  // Load simulation data when editing
  useEffect(() => {
    if (simulation) {
      setFormData(simulation);
      setSimulationType(simulation.type);
      if (simulation.results) {
        setActiveTab('results');
      }
    }
  }, [simulation]);

  // Save simulation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertSimulation>) => {
      if (simulationId) {
        return apiRequest(`/api/simulations/${simulationId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/simulations', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: async (savedSimulation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
      
      // Update current form data with saved simulation
      setFormData(savedSimulation);
      
      if (!simulationId) {
        // Redirect to edit mode after creating
        setLocation(`/simulation/${savedSimulation.id}`);
      }
      
      toast({
        title: "Simulação salva",
        description: "Dados salvos com sucesso. Agora você pode calcular os resultados.",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao salvar:', error);
      
      // Check if it's a plan limit error
      if (error.message?.includes('Limite de simulações atingido') || error.status === 403) {
        toast({
          variant: "destructive",
          title: "Limite Atingido",
          description: "Você atingiu o limite de simulações do plano demo. Faça upgrade para Premium.",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/upgrade')}
            >
              Fazer Upgrade
            </Button>
          ),
        });
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a simulação.",
      });
    },
  });

  // Calculate simulation mutation
  const calculateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/simulations/${id}/calculate`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: async (calculatedSimulation) => {
      setFormData(calculatedSimulation);
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/simulations/${calculatedSimulation.id}`] });
      setActiveTab('results');
      
      toast({
        title: "Simulação calculada",
        description: "Cálculos realizados com sucesso. Você pode visualizar os resultados agora.",
      });
    },
    onError: (error) => {
      console.error('Erro no cálculo:', error);
      toast({
        variant: "destructive",
        title: "Erro no cálculo",
        description: error.message || "Não foi possível calcular a simulação.",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleCalculate = async () => {
    if (!simulationId) {
      // Save first, then calculate
      try {
        const savedSimulation = await apiRequest('/api/simulations', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        calculateMutation.mutate(savedSimulation.id);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Salve a simulação antes de calcular.",
        });
      }
    } else {
      // Save current data and calculate
      await saveMutation.mutateAsync(formData);
      calculateMutation.mutate(simulationId);
    }
  };

  const updateFormData = (updates: Partial<InsertSimulation>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateParameters = (params: any) => {
    setFormData(prev => ({ 
      ...prev, 
      parameters: { ...prev.parameters, ...params } 
    }));
  };

  if (isLoading && simulationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-solar-orange border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando simulação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {simulationId ? 'Editar Simulação' : 'Nova Simulação'}
          </h1>
          <p className="text-gray-600 mt-2">
            Configure os parâmetros para sua simulação solar
          </p>
        </div>
        <Button 
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      {/* Plan Warning for Demo Users */}
      {user?.plan === 'demo' && planAccess?.remainingSimulations === 0 && !simulationId && (
        <Alert className="border-red-200 bg-red-50">
          <Crown className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Limite de Demo Atingido</AlertTitle>
          <AlertDescription className="text-red-700">
            Você atingiu o limite de 1 simulação do plano demo. Para criar novas simulações, faça upgrade para Premium.
            <Button
              variant="link"
              className="p-0 text-red-600 underline ml-1"
              onClick={() => setLocation('/upgrade')}
            >
              Fazer Upgrade Agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Simulation Form - Interface Simplificada */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Configuração</TabsTrigger>
            <TabsTrigger value="results" disabled={!formData.results}>
              Resultados
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="form" className="space-y-8">
              
              {/* Seleção de Tipo Simplificada */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tipo de Simulação</h3>
                <TypeSelector
                  selectedType={simulationType}
                  onTypeSelect={(type) => {
                    setSimulationType(type);
                    updateFormData({ type: type as any });
                  }}
                />
              </div>

              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações do Projeto</h3>
                <BasicForm
                  data={formData}
                  onChange={updateFormData}
                />
              </div>

              {/* Configuração Específica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Parâmetros Técnicos</h3>
                <SpecificConfig
                  type={simulationType}
                  parameters={formData.parameters || {}}
                  onChange={updateParameters}
                />
              </div>
              
              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {calculateMutation.isPending ? 'Calculando...' : 'Calcular Simulação'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {formData.results && (
                <ResultsDisplayEnhanced
                  type={simulationType}
                  results={formData.results}
                  simulation={formData as Simulation}
                />
              )}
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline">
                  Baixar Relatório
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Simulação'}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
