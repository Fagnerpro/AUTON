import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SpecificConfigProps {
  type: string;
  parameters: any;
  onChange: (params: any) => void;
}

export default function SpecificConfig({ type, parameters, onChange }: SpecificConfigProps) {
  const handleChange = (field: string, value: string) => {
    onChange({ [field]: value });
  };

  // Debug removed for production

  if (!type) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Selecione um tipo de simulação primeiro</p>
      </div>
    );
  }

  const renderResidentialConfig = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="monthlyConsumption">Consumo Mensal (kWh)</Label>
        <Input
          id="monthlyConsumption"
          type="number"
          placeholder="350"
          value={parameters.monthlyConsumption || ''}
          onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Energia consumida por mês na residência
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availableArea">Área Disponível (m²)</Label>
        <Input
          id="availableArea"
          type="number"
          placeholder="50"
          value={parameters.availableArea || ''}
          onChange={(e) => handleChange('availableArea', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Área de telhado para instalação dos painéis
        </p>
      </div>
    </div>
  );

  const renderEVChargingConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="num_parking_spots">Número de Vagas</Label>
          <Input
            id="num_parking_spots"
            type="number"
            placeholder="20"
            value={parameters.num_parking_spots || ''}
            onChange={(e) => handleChange('num_parking_spots', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Total de vagas de estacionamento
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="charging_points_percentage">% com Recarga</Label>
          <Input
            id="charging_points_percentage"
            type="number"
            placeholder="25"
            value={parameters.charging_points_percentage || ''}
            onChange={(e) => handleChange('charging_points_percentage', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Porcentagem de vagas com carregador
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="energy_per_charge">Energia por Carga (kWh)</Label>
          <Input
            id="energy_per_charge"
            type="number"
            placeholder="18"
            value={parameters.energy_per_charge || ''}
            onChange={(e) => handleChange('energy_per_charge', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Energia média por recarga completa
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="charges_per_day">Cargas por Dia</Label>
          <Input
            id="charges_per_day"
            type="number"
            placeholder="1"
            value={parameters.charges_per_day || ''}
            onChange={(e) => handleChange('charges_per_day', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Número de cargas por dia por ponto
          </p>
        </div>
      </div>
    </div>
  );

  const renderCommercialConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyConsumption">Consumo Mensal (kWh)</Label>
          <Input
            id="monthlyConsumption"
            type="number"
            placeholder="Ex: 2500"
            value={parameters.monthlyConsumption || ''}
            onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Consumo mensal médio da empresa
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="availableArea">Área Disponível (m²)</Label>
          <Input
            id="availableArea"
            type="number"
            placeholder="Ex: 800"
            value={parameters.availableArea || ''}
            onChange={(e) => handleChange('availableArea', e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Área de telhado disponível para painéis
          </p>
        </div>
      </div>
    </div>
  );

  const renderCommonAreasConfig = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="monthlyConsumption">Consumo Mensal (kWh)</Label>
        <Input
          id="monthlyConsumption"
          type="number"
          placeholder="500"
          value={parameters.monthlyConsumption || ''}
          onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Energia mensal das áreas comuns
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availableArea">Área Disponível (m²)</Label>
        <Input
          id="availableArea"
          type="number"
          placeholder="200"
          value={parameters.availableArea || ''}
          onChange={(e) => handleChange('availableArea', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Área para instalação dos painéis
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuração Específica</h3>
        <p className="text-gray-600">Parâmetros técnicos da simulação</p>
      </div>

      {type === 'residential' && renderResidentialConfig()}
      {type === 'ev_charging' && renderEVChargingConfig()}
      {type === 'commercial' && renderCommercialConfig()}
      {type === 'common_areas' && renderCommonAreasConfig()}
    </div>
  );
}
