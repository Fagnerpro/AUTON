import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Zap, TrendingUp, Shield, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatCurrency } from '@/lib/utils';

interface PricingCalculatorProps {
  onProceedToPayment?: (config: PricingConfig) => void;
  showPaymentButton?: boolean;
}

interface PricingConfig {
  systemSize: number;
  panelType: 'standard' | 'premium' | 'bifacial';
  installationType: 'rooftop' | 'ground' | 'carport';
  location: string;
  monthlyConsumption: number;
  hasStorage: boolean;
  storageCapacity: number;
  warranty: 'basic' | 'extended' | 'premium';
}

const PANEL_TYPES = {
  standard: { name: 'Padrão 545W', multiplier: 1.0, description: 'Painel monocristalino básico' },
  premium: { name: 'Premium 600W', multiplier: 1.15, description: 'Alta eficiência com garantia estendida' },
  bifacial: { name: 'Bifacial 650W', multiplier: 1.3, description: 'Máxima geração de energia' }
};

const INSTALLATION_TYPES = {
  rooftop: { name: 'Telhado', multiplier: 1.0, description: 'Instalação tradicional' },
  ground: { name: 'Solo', multiplier: 1.2, description: 'Sistema com estruturas no solo' },
  carport: { name: 'Garagem Solar', multiplier: 1.4, description: 'Cobertura + geração' }
};

const WARRANTY_OPTIONS = {
  basic: { name: 'Básica (10 anos)', multiplier: 1.0, description: 'Garantia padrão do fabricante' },
  extended: { name: 'Estendida (15 anos)', multiplier: 1.05, description: 'Proteção adicional' },
  premium: { name: 'Premium (25 anos)', multiplier: 1.12, description: 'Cobertura total' }
};

const BASE_PRICE_PER_KW = 4200; // R$ 4.200 por kW instalado

export default function PricingCalculator({ onProceedToPayment, showPaymentButton = false }: PricingCalculatorProps) {
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState<PricingConfig>({
    systemSize: 5,
    panelType: 'standard',
    installationType: 'rooftop',
    location: 'GO',
    monthlyConsumption: 500,
    hasStorage: false,
    storageCapacity: 0,
    warranty: 'basic'
  });

  const [pricing, setPricing] = useState({
    basePrice: 0,
    installationCost: 0,
    equipmentCost: 0,
    storageCost: 0,
    warrantyFee: 0,
    subtotal: 0,
    taxes: 0,
    total: 0,
    monthlyPayment: 0,
    roi: 0,
    paybackPeriod: 0
  });

  // Calculate pricing in real-time
  useEffect(() => {
    const basePrice = config.systemSize * BASE_PRICE_PER_KW;
    const panelMultiplier = PANEL_TYPES[config.panelType].multiplier;
    const installationMultiplier = INSTALLATION_TYPES[config.installationType].multiplier;
    const warrantyMultiplier = WARRANTY_OPTIONS[config.warranty].multiplier;

    const equipmentCost = basePrice * panelMultiplier;
    const installationCost = basePrice * 0.3 * installationMultiplier;
    const storageCost = config.hasStorage ? config.storageCapacity * 2800 : 0; // R$ 2.800 per kWh
    const warrantyFee = basePrice * (warrantyMultiplier - 1);

    const subtotal = equipmentCost + installationCost + storageCost + warrantyFee;
    const taxes = subtotal * 0.17; // 17% taxes
    const total = subtotal + taxes;

    // Calculate financial metrics
    const monthlyGeneration = config.systemSize * 150; // kWh estimated per kW
    const monthlySavings = monthlyGeneration * 0.75; // R$ 0.75 per kWh
    const annualSavings = monthlySavings * 12;
    const paybackPeriod = total / annualSavings;
    const roi = (annualSavings * 25 - total) / total * 100; // 25-year ROI

    setPricing({
      basePrice,
      installationCost,
      equipmentCost,
      storageCost,
      warrantyFee,
      subtotal,
      taxes,
      total,
      monthlyPayment: total / 120, // 10-year financing
      roi,
      paybackPeriod
    });
  }, [config]);

  const updateConfig = (updates: Partial<PricingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleProceedToPayment = () => {
    if (onProceedToPayment) {
      onProceedToPayment(config);
    } else {
      // Navigate to upgrade page with pricing data
      setLocation('/upgrade');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Configuração do Sistema
          </CardTitle>
          <CardDescription>
            Configure seu sistema solar ideal e veja o preço em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Size */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Potência do Sistema: {config.systemSize} kW
            </Label>
            <Slider
              value={[config.systemSize]}
              onValueChange={([value]) => updateConfig({ systemSize: value })}
              max={20}
              min={2}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2 kW</span>
              <span>20 kW</span>
            </div>
          </div>

          {/* Monthly Consumption */}
          <div className="space-y-2">
            <Label htmlFor="consumption">Consumo Mensal (kWh)</Label>
            <Input
              id="consumption"
              type="number"
              value={config.monthlyConsumption}
              onChange={(e) => updateConfig({ monthlyConsumption: parseInt(e.target.value) || 0 })}
              placeholder="500"
            />
          </div>

          {/* Panel Type */}
          <div className="space-y-2">
            <Label>Tipo de Painel</Label>
            <Select 
              value={config.panelType} 
              onValueChange={(value: any) => updateConfig({ panelType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PANEL_TYPES).map(([key, panel]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{panel.name}</span>
                      <span className="text-xs text-gray-500">{panel.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installation Type */}
          <div className="space-y-2">
            <Label>Tipo de Instalação</Label>
            <Select 
              value={config.installationType} 
              onValueChange={(value: any) => updateConfig({ installationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTALLATION_TYPES).map(([key, installation]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{installation.name}</span>
                      <span className="text-xs text-gray-500">{installation.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select 
              value={config.location} 
              onValueChange={(value) => updateConfig({ location: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Storage Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="storage"
                checked={config.hasStorage}
                onChange={(e) => updateConfig({ hasStorage: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="storage">Incluir Sistema de Armazenamento</Label>
            </div>
            
            {config.hasStorage && (
              <div className="space-y-2">
                <Label>Capacidade de Armazenamento: {config.storageCapacity} kWh</Label>
                <Slider
                  value={[config.storageCapacity]}
                  onValueChange={([value]) => updateConfig({ storageCapacity: value })}
                  max={20}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Warranty */}
          <div className="space-y-2">
            <Label>Garantia</Label>
            <Select 
              value={config.warranty} 
              onValueChange={(value: any) => updateConfig({ warranty: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WARRANTY_OPTIONS).map(([key, warranty]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{warranty.name}</span>
                      <span className="text-xs text-gray-500">{warranty.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Panel */}
      <div className="space-y-6">
        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Detalhamento de Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Equipamentos</span>
                <span>{formatCurrency(pricing.equipmentCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instalação</span>
                <span>{formatCurrency(pricing.installationCost)}</span>
              </div>
              {config.hasStorage && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sistema de Armazenamento</span>
                  <span>{formatCurrency(pricing.storageCost)}</span>
                </div>
              )}
              {pricing.warrantyFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Garantia</span>
                  <span>{formatCurrency(pricing.warrantyFee)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos (17%)</span>
                <span>{formatCurrency(pricing.taxes)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(pricing.total)}</span>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                ou {formatCurrency(pricing.monthlyPayment)}/mês por 10 anos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {pricing.paybackPeriod.toFixed(1)} anos
                </div>
                <div className="text-sm text-gray-500">Payback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pricing.roi.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">ROI (25 anos)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Resumo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Potência:</span>
              <Badge variant="secondary">{config.systemSize} kW</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Geração Estimada:</span>
              <Badge variant="secondary">{(config.systemSize * 150).toFixed(0)} kWh/mês</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Economia Mensal:</span>
              <Badge variant="secondary">{formatCurrency(config.systemSize * 150 * 0.75)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Painéis:</span>
              <Badge variant="secondary">{PANEL_TYPES[config.panelType].name}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Instalação:</span>
              <Badge variant="secondary">{INSTALLATION_TYPES[config.installationType].name}</Badge>
            </div>
            {config.hasStorage && (
              <div className="flex justify-between items-center">
                <span>Armazenamento:</span>
                <Badge variant="secondary">{config.storageCapacity} kWh</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        {showPaymentButton && (
          <Button 
            onClick={handleProceedToPayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
            size="lg"
          >
            <Shield className="h-5 w-5 mr-2" />
            Prosseguir com o Pagamento
          </Button>
        )}
      </div>
    </div>
  );
}