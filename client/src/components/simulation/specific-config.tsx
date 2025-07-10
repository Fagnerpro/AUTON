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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="chargingStations">Pontos de Recarga</Label>
        <Input
          id="chargingStations"
          type="number"
          placeholder="4"
          value={parameters.chargingStations || ''}
          onChange={(e) => handleChange('chargingStations', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Número de carregadores a instalar
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="powerPerStation">Potência por Ponto (kW)</Label>
        <Input
          id="powerPerStation"
          type="number"
          placeholder="22"
          value={parameters.powerPerStation || ''}
          onChange={(e) => handleChange('powerPerStation', e.target.value)}
        />
        <p className="text-sm text-gray-600">
          Potência de cada carregador (7kW, 11kW, 22kW)
        </p>
      </div>
    </div>
  );

  const renderCommercialConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_consumption">Consumo Mensal (kWh)</Label>
          <Input
            id="monthly_consumption"
            type="number"
            placeholder="Ex: 2500"
            value={parameters.monthly_consumption || ''}
            onChange={(e) => handleChange('monthly_consumption', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="available_area">Área Disponível (m²)</Label>
          <Input
            id="available_area"
            type="number"
            placeholder="Ex: 800"
            value={parameters.available_area || ''}
            onChange={(e) => handleChange('available_area', e.target.value)}
          />
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
