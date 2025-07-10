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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto</Label>
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

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Rua, número, bairro"
          value={data.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
        />
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
    </div>
  );
}
