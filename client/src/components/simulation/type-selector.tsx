import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Car, Zap } from 'lucide-react';

interface TypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

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
];

export default function TypeSelector({ selectedType, onTypeSelect }: TypeSelectorProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione o Tipo de Simulação</h3>
        <p className="text-gray-600">Escolha o tipo que melhor se adequa ao seu projeto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {simulationTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-solar-orange bg-orange-50' 
                  : 'hover:shadow-md hover:border-solar-orange/50'
              }`}
              onClick={() => onTypeSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected 
                      ? 'bg-solar-orange text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    {isSelected && (
                      <Badge className="mt-2 bg-solar-orange hover:bg-orange-600">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
