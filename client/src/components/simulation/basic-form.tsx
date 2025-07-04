import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { InsertSimulation } from '@shared/schema';

interface BasicFormProps {
  data: Partial<InsertSimulation>;
  onChange: (updates: Partial<InsertSimulation>) => void;
}

export default function BasicForm({ data, onChange }: BasicFormProps) {
  const handleChange = (field: keyof InsertSimulation, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações Básicas</h3>
        <p className="text-gray-600">Dados gerais sobre o projeto</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Simulação</Label>
            <Input
              id="name"
              placeholder="Ex: Residencial Vila Verde"
              value={data.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Ex: Goiânia"
              value={data.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
        </div>

        {/* Configuração do Empreendimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="md:col-span-3">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">🏢 Configuração do Empreendimento</h4>
            <p className="text-sm text-blue-700 mb-4">
              <strong>📌 IMPORTANTE:</strong> Defina aqui as características gerais do projeto. 
              Na próxima etapa você informará dados <strong>por unidade individual</strong>.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalUnits" className="text-sm font-medium">
              Total de Unidades do Empreendimento
            </Label>
            <Input
              id="totalUnits"
              type="number"
              min="1"
              placeholder="Ex: 90"
              value={data.totalUnits || 1}
              onChange={(e) => handleChange('totalUnits', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-gray-600">
              Quantos apartamentos/casas terá o projeto completo?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hasCommonAreas" className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasCommonAreas || false}
                onChange={(e) => handleChange('hasCommonAreas', e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Incluir Áreas Comuns</span>
                <p className="text-xs text-gray-600">
                  Piscina, academia, salão de festa, portaria
                </p>
              </div>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hasEvCharging" className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasEvCharging || false}
                onChange={(e) => handleChange('hasEvCharging', e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="text-sm font-medium">Incluir Estação de Recarga VE</span>
                <p className="text-xs text-gray-600">
                  Para carros elétricos na garagem
                </p>
              </div>
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descreva o projeto..."
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            placeholder="Rua, número, bairro"
            value={data.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
