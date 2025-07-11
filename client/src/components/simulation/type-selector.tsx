import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {simulationTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-gray-300'
            }`}
            onClick={() => onTypeSelect(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}