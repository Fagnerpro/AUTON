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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-5 rounded-r-lg">
        <div className="flex items-start space-x-3">
          <div className="text-green-600 text-lg">🏠</div>
          <div>
            <h4 className="text-green-800 font-semibold mb-1">Dados por Unidade Individual</h4>
            <p className="text-sm text-green-700">
              Informe os valores de <strong>UMA única unidade</strong> (apartamento/casa). 
              O sistema irá multiplicar automaticamente pelo total de unidades definido anteriormente.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="monthlyConsumption" className="text-sm font-medium text-gray-700">
            💡 Consumo Mensal de Energia Elétrica
          </Label>
          <Input
            id="monthlyConsumption"
            type="number"
            placeholder="350"
            value={parameters.monthlyConsumption || ''}
            onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> kWh médios consumidos por mês em UMA unidade</p>
            <p><strong>Exemplos:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Apartamento 2 quartos: 250-350 kWh</li>
              <li>Apartamento 3 quartos: 350-500 kWh</li>
              <li>Casa térrea: 400-600 kWh</li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="roofArea" className="text-sm font-medium text-gray-700">
            📐 Área de Telhado Disponível
          </Label>
          <Input
            id="roofArea"
            type="number"
            placeholder="50"
            value={parameters.roofArea || ''}
            onChange={(e) => handleChange('roofArea', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> m² de telhado livre de UMA unidade para painéis</p>
            <p><strong>Dicas:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Descontar: caixas d'água, antenas, chaminés</li>
              <li>Apartamento: geralmente 20-60 m²</li>
              <li>Casa: geralmente 50-150 m²</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEVChargingConfig = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-400 p-5 rounded-r-lg">
        <div className="flex items-start space-x-3">
          <div className="text-purple-600 text-lg">🔌</div>
          <div>
            <h4 className="text-purple-800 font-semibold mb-1">Estação de Recarga para Carros Elétricos</h4>
            <p className="text-sm text-purple-700">
              Configure o sistema de recarga para o <strong>empreendimento completo</strong>. 
              Valores totais da garagem/estacionamento do projeto.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="num_parking_spots" className="text-sm font-medium text-gray-700">
            🚗 Total de Vagas de Garagem
          </Label>
          <Input
            id="num_parking_spots"
            type="number"
            placeholder="90"
            value={parameters.num_parking_spots || ''}
            onChange={(e) => handleChange('num_parking_spots', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> Total de vagas do empreendimento</p>
            <p><strong>Exemplo:</strong> Prédio 90 apts = ~90-120 vagas</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="charging_points_percentage" className="text-sm font-medium text-gray-700">
            ⚡ Percentual com Recarga Elétrica
          </Label>
          <Input
            id="charging_points_percentage"
            type="number"
            placeholder="15"
            value={parameters.charging_points_percentage || ''}
            onChange={(e) => handleChange('charging_points_percentage', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> % de vagas com ponto de recarga</p>
            <p><strong>Recomendado:</strong> 10-20% (futuro crescimento)</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="energy_per_charge" className="text-sm font-medium text-gray-700">
            🔋 Energia por Recarga Completa
          </Label>
          <Input
            id="energy_per_charge"
            type="number"
            placeholder="50"
            value={parameters.energy_per_charge || ''}
            onChange={(e) => handleChange('energy_per_charge', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> kWh para carregar completamente</p>
            <p><strong>Exemplos:</strong> Sedan: 50kWh | SUV: 70kWh</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="charges_per_day" className="text-sm font-medium text-gray-700">
            📅 Recargas por Dia (por ponto)
          </Label>
          <Input
            id="charges_per_day"
            type="number"
            placeholder="1"
            value={parameters.charges_per_day || ''}
            onChange={(e) => handleChange('charges_per_day', e.target.value)}
            className="text-base"
          />
          <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
            <p><strong>O que informar:</strong> Quantas recargas/dia por ponto</p>
            <p><strong>Residencial:</strong> 0.5-1 | <strong>Comercial:</strong> 2-3</p>
          </div>
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
