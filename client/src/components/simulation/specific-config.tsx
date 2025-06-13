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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="num_units">Número de Unidades</Label>
          <Input
            id="num_units"
            type="number"
            placeholder="Ex: 24"
            value={parameters.num_units || ''}
            onChange={(e) => handleChange('num_units', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="consumption_per_unit">Consumo por Unidade (kWh/mês)</Label>
          <Input
            id="consumption_per_unit"
            type="number"
            placeholder="Ex: 250"
            value={parameters.consumption_per_unit || ''}
            onChange={(e) => handleChange('consumption_per_unit', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="available_area">Área Disponível (m²)</Label>
          <Input
            id="available_area"
            type="number"
            placeholder="Ex: 500"
            value={parameters.available_area || ''}
            onChange={(e) => handleChange('available_area', e.target.value)}
          />
        </div>
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
            placeholder="Ex: 50"
            value={parameters.num_parking_spots || ''}
            onChange={(e) => handleChange('num_parking_spots', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="charging_points_percentage">% de Pontos de Recarga</Label>
          <Input
            id="charging_points_percentage"
            type="number"
            placeholder="Ex: 20"
            value={parameters.charging_points_percentage || ''}
            onChange={(e) => handleChange('charging_points_percentage', e.target.value)}
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
            value={parameters.energy_per_charge || '18'}
            onChange={(e) => handleChange('energy_per_charge', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="charges_per_day">Recargas por Dia</Label>
          <Input
            id="charges_per_day"
            type="number"
            placeholder="1"
            value={parameters.charges_per_day || '1'}
            onChange={(e) => handleChange('charges_per_day', e.target.value)}
          />
        </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily_consumption">Consumo Diário (kWh)</Label>
          <Input
            id="daily_consumption"
            type="number"
            placeholder="Ex: 150"
            value={parameters.daily_consumption || ''}
            onChange={(e) => handleChange('daily_consumption', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="critical_consumption_per_hour">Consumo Crítico (kWh/h)</Label>
          <Input
            id="critical_consumption_per_hour"
            type="number"
            placeholder="Ex: 8"
            value={parameters.critical_consumption_per_hour || ''}
            onChange={(e) => handleChange('critical_consumption_per_hour', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="backup_hours">Horas de Backup</Label>
          <Input
            id="backup_hours"
            type="number"
            placeholder="8"
            value={parameters.backup_hours || '8'}
            onChange={(e) => handleChange('backup_hours', e.target.value)}
          />
        </div>
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
