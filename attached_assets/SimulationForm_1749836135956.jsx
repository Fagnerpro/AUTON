import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Building, 
  Car, 
  Zap, 
  Calculator, 
  MapPin,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

function SimulationForm() {
  const [activeTab, setActiveTab] = useState('basic')
  const [simulationType, setSimulationType] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [results, setResults] = useState(null)
  
  const [formData, setFormData] = useState({
    // Dados básicos
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'GO',
    
    // Dados específicos por tipo
    residential: {
      num_units: '',
      consumption_per_unit: '',
      available_area: ''
    },
    ev_charging: {
      num_parking_spots: '',
      charging_points_percentage: '',
      energy_per_charge: '18',
      charges_per_day: '1'
    },
    common_areas: {
      daily_consumption: '',
      critical_consumption_per_hour: '',
      backup_hours: '8'
    },
    commercial: {
      monthly_consumption: '',
      available_area: ''
    }
  })

  const simulationTypes = [
    {
      id: 'residential',
      name: 'Residencial',
      description: 'Simulação para unidades habitacionais',
      icon: Building
    },
    {
      id: 'ev_charging',
      name: 'Recarga de Veículos Elétricos',
      description: 'Sistema para pontos de recarga',
      icon: Car
    },
    {
      id: 'common_areas',
      name: 'Áreas Comuns',
      description: 'Sistemas críticos de condomínios',
      icon: Zap
    },
    {
      id: 'commercial',
      name: 'Comercial',
      description: 'Estabelecimentos comerciais',
      icon: Building
    }
  ]

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleBasicChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateSimulation = async () => {
    setIsCalculating(true)
    
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Resultados simulados baseados no tipo
      let mockResults = {}
      
      if (simulationType === 'residential') {
        const numUnits = parseInt(formData.residential.num_units) || 0
        const consumption = parseFloat(formData.residential.consumption_per_unit) || 0
        const area = parseFloat(formData.residential.available_area) || 0
        
        mockResults = {
          num_panels: Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000 / 550),
          total_power: Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000),
          required_area: Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000 / 550) * 2.1,
          annual_generation: numUnits * consumption * 12,
          total_investment: Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000) * 4.5,
          annual_savings: numUnits * consumption * 12 * 0.65,
          payback_years: (Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000) * 4.5) / (numUnits * consumption * 12 * 0.65),
          area_sufficient: area >= (Math.ceil((numUnits * consumption * 12) / (5.5 * 365) * 1000 / 550) * 2.1)
        }
      } else if (simulationType === 'ev_charging') {
        const spots = parseInt(formData.ev_charging.num_parking_spots) || 0
        const percentage = parseFloat(formData.ev_charging.charging_points_percentage) || 0
        const energyPerCharge = parseFloat(formData.ev_charging.energy_per_charge) || 18
        
        const chargingPoints = Math.floor(spots * percentage / 100)
        const dailyConsumption = chargingPoints * energyPerCharge
        
        mockResults = {
          num_charging_points: chargingPoints,
          num_panels: Math.ceil(dailyConsumption / 5.5 * 1000 / 550),
          total_power: Math.ceil(dailyConsumption / 5.5 * 1000),
          daily_consumption: dailyConsumption,
          annual_consumption: dailyConsumption * 365,
          battery_capacity: dailyConsumption * 1.2,
          total_investment: Math.ceil(dailyConsumption / 5.5 * 1000) * 4.5 + (dailyConsumption * 1.2 * 800),
          annual_savings: dailyConsumption * 365 * 0.15,
          payback_years: (Math.ceil(dailyConsumption / 5.5 * 1000) * 4.5 + (dailyConsumption * 1.2 * 800)) / (dailyConsumption * 365 * 0.15)
        }
      }
      
      setResults(mockResults)
      setActiveTab('results')
    } catch (error) {
      console.error('Erro no cálculo:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const renderTypeSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {simulationTypes.map((type) => {
        const Icon = type.icon
        return (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all ${
              simulationType === type.id 
                ? 'ring-2 ring-orange-500 bg-orange-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSimulationType(type.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  simulationType === type.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  {simulationType === type.id && (
                    <Badge className="mt-2 bg-orange-500">Selecionado</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderBasicForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Simulação</Label>
          <Input
            id="name"
            placeholder="Ex: Residencial Vila Verde"
            value={formData.name}
            onChange={(e) => handleBasicChange('name', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="Ex: Goiânia"
            value={formData.city}
            onChange={(e) => handleBasicChange('city', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          placeholder="Descreva o projeto..."
          value={formData.description}
          onChange={(e) => handleBasicChange('description', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Rua, número, bairro"
          value={formData.address}
          onChange={(e) => handleBasicChange('address', e.target.value)}
        />
      </div>
    </div>
  )

  const renderSpecificForm = () => {
    if (!simulationType) return null

    switch (simulationType) {
      case 'residential':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_units">Número de Unidades</Label>
                <Input
                  id="num_units"
                  type="number"
                  placeholder="Ex: 24"
                  value={formData.residential.num_units}
                  onChange={(e) => handleInputChange('residential', 'num_units', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consumption_per_unit">Consumo por Unidade (kWh/mês)</Label>
                <Input
                  id="consumption_per_unit"
                  type="number"
                  placeholder="Ex: 250"
                  value={formData.residential.consumption_per_unit}
                  onChange={(e) => handleInputChange('residential', 'consumption_per_unit', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="available_area">Área Disponível (m²)</Label>
                <Input
                  id="available_area"
                  type="number"
                  placeholder="Ex: 500"
                  value={formData.residential.available_area}
                  onChange={(e) => handleInputChange('residential', 'available_area', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 'ev_charging':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_parking_spots">Número de Vagas</Label>
                <Input
                  id="num_parking_spots"
                  type="number"
                  placeholder="Ex: 50"
                  value={formData.ev_charging.num_parking_spots}
                  onChange={(e) => handleInputChange('ev_charging', 'num_parking_spots', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="charging_points_percentage">% de Pontos de Recarga</Label>
                <Input
                  id="charging_points_percentage"
                  type="number"
                  placeholder="Ex: 20"
                  value={formData.ev_charging.charging_points_percentage}
                  onChange={(e) => handleInputChange('ev_charging', 'charging_points_percentage', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energy_per_charge">Energia por Recarga (kWh)</Label>
                <Input
                  id="energy_per_charge"
                  type="number"
                  placeholder="18"
                  value={formData.ev_charging.energy_per_charge}
                  onChange={(e) => handleInputChange('ev_charging', 'energy_per_charge', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="charges_per_day">Recargas por Dia</Label>
                <Input
                  id="charges_per_day"
                  type="number"
                  placeholder="1"
                  value={formData.ev_charging.charges_per_day}
                  onChange={(e) => handleInputChange('ev_charging', 'charges_per_day', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 'common_areas':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_consumption">Consumo Diário (kWh)</Label>
                <Input
                  id="daily_consumption"
                  type="number"
                  placeholder="Ex: 150"
                  value={formData.common_areas.daily_consumption}
                  onChange={(e) => handleInputChange('common_areas', 'daily_consumption', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="critical_consumption_per_hour">Consumo Crítico (kWh/h)</Label>
                <Input
                  id="critical_consumption_per_hour"
                  type="number"
                  placeholder="Ex: 15"
                  value={formData.common_areas.critical_consumption_per_hour}
                  onChange={(e) => handleInputChange('common_areas', 'critical_consumption_per_hour', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup_hours">Horas de Backup</Label>
                <Input
                  id="backup_hours"
                  type="number"
                  placeholder="8"
                  value={formData.common_areas.backup_hours}
                  onChange={(e) => handleInputChange('common_areas', 'backup_hours', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 'commercial':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_consumption">Consumo Mensal (kWh)</Label>
                <Input
                  id="monthly_consumption"
                  type="number"
                  placeholder="Ex: 5000"
                  value={formData.commercial.monthly_consumption}
                  onChange={(e) => handleInputChange('commercial', 'monthly_consumption', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="available_area">Área Disponível (m²)</Label>
                <Input
                  id="available_area"
                  type="number"
                  placeholder="Ex: 800"
                  value={formData.commercial.available_area}
                  onChange={(e) => handleInputChange('commercial', 'available_area', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderResults = () => {
    if (!results) return null

    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Simulação calculada com sucesso! Confira os resultados abaixo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Resultados Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Especificações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.num_panels && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Painéis Solares:</span>
                  <span className="font-semibold">{results.num_panels} unidades</span>
                </div>
              )}
              {results.total_power && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Potência Total:</span>
                  <span className="font-semibold">{(results.total_power / 1000).toFixed(1)} kWp</span>
                </div>
              )}
              {results.required_area && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Área Necessária:</span>
                  <span className="font-semibold">{results.required_area.toFixed(1)} m²</span>
                </div>
              )}
              {results.num_charging_points && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pontos de Recarga:</span>
                  <span className="font-semibold">{results.num_charging_points} unidades</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Análise Financeira */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise Financeira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.total_investment && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Investimento:</span>
                  <span className="font-semibold">R$ {results.total_investment.toLocaleString()}</span>
                </div>
              )}
              {results.annual_savings && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Economia Anual:</span>
                  <span className="font-semibold text-green-600">R$ {results.annual_savings.toLocaleString()}</span>
                </div>
              )}
              {results.payback_years && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payback:</span>
                  <span className="font-semibold">{results.payback_years.toFixed(1)} anos</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geração de Energia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Geração de Energia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.annual_generation && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Geração Anual:</span>
                  <span className="font-semibold">{results.annual_generation.toLocaleString()} kWh</span>
                </div>
              )}
              {results.daily_consumption && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Consumo Diário:</span>
                  <span className="font-semibold">{results.daily_consumption.toFixed(1)} kWh</span>
                </div>
              )}
              {results.battery_capacity && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bateria:</span>
                  <span className="font-semibold">{results.battery_capacity.toFixed(1)} kWh</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {results.area_sufficient === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A área disponível é insuficiente para o sistema completo. 
              Considere reduzir o consumo ou aumentar a área disponível.
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex space-x-4">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
          <Button variant="outline">
            Salvar Simulação
          </Button>
          <Button variant="outline">
            Nova Simulação
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nova Simulação</h1>
        <p className="text-gray-600 mt-2">
          Configure os parâmetros e calcule seu sistema solar
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="type">1. Tipo</TabsTrigger>
              <TabsTrigger value="basic" disabled={!simulationType}>2. Básico</TabsTrigger>
              <TabsTrigger value="specific" disabled={!simulationType}>3. Específico</TabsTrigger>
              <TabsTrigger value="results" disabled={!results}>4. Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Selecione o Tipo de Simulação</h3>
                  <p className="text-gray-600 mb-6">
                    Escolha o tipo de sistema solar que melhor se adequa ao seu projeto.
                  </p>
                </div>
                {renderTypeSelector()}
                {simulationType && (
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('basic')}>
                      Continuar
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="basic" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informações Básicas</h3>
                  <p className="text-gray-600 mb-6">
                    Preencha as informações gerais do projeto.
                  </p>
                </div>
                {renderBasicForm()}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('type')}>
                    Voltar
                  </Button>
                  <Button onClick={() => setActiveTab('specific')}>
                    Continuar
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specific" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Parâmetros Específicos</h3>
                  <p className="text-gray-600 mb-6">
                    Configure os parâmetros técnicos da simulação.
                  </p>
                </div>
                {renderSpecificForm()}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('basic')}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={calculateSimulation}
                    disabled={isCalculating}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {isCalculating ? 'Calculando...' : 'Calcular Simulação'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              {renderResults()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default SimulationForm

