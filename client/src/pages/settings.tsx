import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SafeSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-safe';
import { SafeTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-safe';
import { User as UserIcon, Settings as SettingsIcon, Bell, Shield, FileText, Calculator } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SOLAR_SIMULATION_CONFIG } from '@shared/simulation-config';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailReports: true,
    simulationComplete: true,
    weeklyDigest: false,
  });

  // System preferences
  const [systemPrefs, setSystemPrefs] = useState({
    defaultState: 'GO',
    defaultTariff: SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh,
    autoCalculate: true,
  });

  // Fetch user data
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/me'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/users/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/users/preferences', data);
    },
    onSuccess: () => {
      toast({
        title: "Preferências atualizadas",
        description: "Suas configurações foram salvas.",
      });
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate(userProfile);
  };

  const handlePreferencesSave = () => {
    updatePreferencesMutation.mutate({
      notifications,
      systemPrefs,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">
          Gerencie seu perfil, preferências e configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Mantenha suas informações pessoais e da empresa atualizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={userProfile.name || user?.name || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email || user?.email || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={userProfile.company || user?.company || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone || user?.phone || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(xx) xxxxx-xxxx"
                  />
                </div>
              </div>
              <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios por Email</Label>
                  <p className="text-sm text-gray-500">
                    Receba relatórios de simulação diretamente no seu email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReports}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailReports: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Simulação Concluída</Label>
                  <p className="text-sm text-gray-500">
                    Notificação quando uma simulação for calculada
                  </p>
                </div>
                <Switch
                  checked={notifications.simulationComplete}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, simulationComplete: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumo Semanal</Label>
                  <p className="text-sm text-gray-500">
                    Receba um resumo semanal das suas atividades
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, weeklyDigest: checked }))
                  }
                />
              </div>
              
              <Button onClick={handlePreferencesSave} disabled={updatePreferencesMutation.isPending}>
                {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Defina valores padrão para cálculos e simulações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultState">Estado Padrão</Label>
                  <Select value={systemPrefs.defaultState} onValueChange={(value) => 
                    setSystemPrefs(prev => ({ ...prev, defaultState: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="defaultTariff">Tarifa Padrão (R$/kWh)</Label>
                  <Input
                    id="defaultTariff"
                    type="number"
                    step="0.01"
                    value={systemPrefs.defaultTariff}
                    onChange={(e) => setSystemPrefs(prev => ({ 
                      ...prev, 
                      defaultTariff: parseFloat(e.target.value) || 0.75 
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cálculo Automático</Label>
                    <p className="text-sm text-gray-500">
                      Calcular automaticamente ao salvar simulação
                    </p>
                  </div>
                  <Switch
                    checked={systemPrefs.autoCalculate}
                    onCheckedChange={(checked) => 
                      setSystemPrefs(prev => ({ ...prev, autoCalculate: checked }))
                    }
                  />
                </div>
                
                <Button onClick={handlePreferencesSave} disabled={updatePreferencesMutation.isPending}>
                  {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parâmetros Técnicos</CardTitle>
                <CardDescription>
                  Valores técnicos utilizados nos cálculos (somente leitura)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Potência do Painel:</span>
                      <span>{SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power}Wp</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Área do Painel:</span>
                      <span>{SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eficiência do Sistema:</span>
                      <span>{(SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Custo por Wp:</span>
                      <span>R$ {SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aumento Anual da Tarifa:</span>
                      <span>{(SOLAR_SIMULATION_CONFIG.FINANCIAL.annual_increase * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vida Útil do Sistema:</span>
                      <span>{SOLAR_SIMULATION_CONFIG.FINANCIAL.system_lifetime} anos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                />
              </div>
              
              <Button variant="outline">
                Alterar Senha
              </Button>
              
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-2">Sessões Ativas</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Gerencie onde você está logado
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Sessão Atual</p>
                      <p className="text-sm text-gray-500">Chrome no Windows • {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Encerrar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}