import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TypeSelector from '@/components/simulation/type-selector';
import BasicForm from '@/components/simulation/basic-form';
import SpecificConfig from '@/components/simulation/specific-config';
import ResultsDisplayEnhanced from '@/components/simulation/results-display-enhanced';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation, InsertSimulation } from '@shared/schema';

export default function SimulationForm() {
  const [, params] = useRoute('/simulation/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('type');
  const [simulationType, setSimulationType] = useState('');
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

  // Fetch existing simulation if editing
  const { data: simulation, isLoading } = useQuery({
    queryKey: ['/api/simulations', simulationId],
    enabled: !!simulationId,
  });

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
      
      if (!simulationId) {
        // Redirect to edit mode after creating
        setLocation(`/simulation/${savedSimulation.id}`);
      }
      
      toast({
        title: "Simulação salva",
        description: "Dados salvos com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error);
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
      setActiveTab('results');
      
      toast({
        title: "Simulação calculada",
        description: "Cálculos realizados com sucesso.",
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

      {/* Simulation Form */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="type">Tipo de Simulação</TabsTrigger>
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="specific">Configuração</TabsTrigger>
            <TabsTrigger value="results" disabled={!formData.results}>
              Resultados
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="type" className="space-y-6">
              <TypeSelector
                selectedType={simulationType}
                onTypeSelect={(type) => {
                  setSimulationType(type);
                  updateFormData({ type: type as any });
                }}
              />
              
              {simulationType && (
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('basic')}>
                    Próximo
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="basic" className="space-y-6">
              <BasicForm
                data={formData}
                onChange={updateFormData}
              />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('type')}
                >
                  Anterior
                </Button>
                <Button onClick={() => setActiveTab('specific')}>
                  Próximo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="specific" className="space-y-6">
              <SpecificConfig
                type={simulationType}
                parameters={formData.parameters || {}}
                onChange={updateParameters}
              />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('basic')}
                >
                  Anterior
                </Button>
                <div className="flex space-x-3">
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
                    className="bg-solar-orange hover:bg-orange-600"
                  >
                    {calculateMutation.isPending ? 'Calculando...' : 'Calcular Simulação'}
                  </Button>
                </div>
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
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('specific')}
                >
                  Anterior
                </Button>
                <div className="flex space-x-3">
                  <Button variant="outline">
                    Baixar Relatório
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-solar-orange hover:bg-orange-600"
                  >
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar Simulação'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
