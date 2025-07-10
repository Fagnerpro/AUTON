import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, Home, Car, Zap } from 'lucide-react';

interface TypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const simulationTypes = [
  {
    id: 'residential',
    name: 'Residencial',
    description: 'Casas e apartamentos',
    icon: Home
  },
  {
    id: 'commercial',
    name: 'Comercial',
    description: 'Lojas e escritórios',
    icon: Building
  },
  {
    id: 'ev_charging',
    name: 'Recarga de Veículos Elétricos',
    description: 'Pontos de recarga',
    icon: Car
  },
  {
    id: 'common_areas',
    name: 'Áreas Comuns',
    description: 'Condomínios e prédios',
    icon: Zap
  }
];

export default function TypeSelector({ selectedType, onTypeSelect }: TypeSelectorProps) {
  const selectedTypeData = simulationTypes.find(t => t.id === selectedType);
  
  return (
    <div className="space-y-4">
      <Select value={selectedType} onValueChange={onTypeSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo de simulação" />
        </SelectTrigger>
        <SelectContent>
          {simulationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedTypeData && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <selectedTypeData.icon className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">{selectedTypeData.name}</h4>
              <p className="text-sm text-blue-700">{selectedTypeData.description}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Selecionado</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
