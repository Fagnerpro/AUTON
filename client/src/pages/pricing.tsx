import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, Star, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import PricingCalculator from '@/components/pricing/pricing-calculator';

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [showCalculator, setShowCalculator] = useState(false);

  const plans = [
    {
      name: 'Residencial',
      description: 'Ideal para casas e pequenos estabelecimentos',
      price: 'A partir de R$ 15.000',
      features: [
        'Sistema de 3-8 kW',
        'Painéis monocristalinos',
        'Inversor string',
        'Monitoramento básico',
        'Garantia de 10 anos',
        'Instalação inclusa'
      ],
      popular: false
    },
    {
      name: 'Comercial',
      description: 'Para empresas e indústrias médias',
      price: 'A partir de R$ 45.000',
      features: [
        'Sistema de 10-50 kW',
        'Painéis de alta eficiência',
        'Inversor otimizado',
        'Monitoramento avançado',
        'Garantia de 15 anos',
        'Manutenção preventiva',
        'Análise de ROI'
      ],
      popular: true
    },
    {
      name: 'Industrial',
      description: 'Soluções para grandes consumidores',
      price: 'Consulte-nos',
      features: [
        'Sistema acima de 50 kW',
        'Tecnologia bifacial',
        'Inversores centrais',
        'Monitoramento 24/7',
        'Garantia de 25 anos',
        'Suporte técnico dedicado',
        'Financiamento facilitado'
      ],
      popular: false
    }
  ];

  if (showCalculator) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calculadora de Preços</h1>
            <p className="text-gray-600 mt-2">
              Configure seu sistema solar e veja o preço em tempo real
            </p>
          </div>
          <Button 
            variant="ghost"
            onClick={() => setShowCalculator(false)}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar aos Planos</span>
          </Button>
        </div>

        <PricingCalculator 
          showPaymentButton={true}
          onProceedToPayment={(config) => {
            // Store configuration and redirect to upgrade
            localStorage.setItem('pricingConfig', JSON.stringify(config));
            setLocation('/upgrade');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos e Preços</h1>
          <p className="text-gray-600 mt-2">
            Escolha o plano ideal para sua necessidade de energia solar
          </p>
        </div>
        <Button 
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      {/* Interactive Calculator CTA */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                Calculadora Interativa de Preços
              </h3>
              <p className="text-gray-600 max-w-2xl">
                Configure seu sistema solar personalizado e veja o preço em tempo real. 
                Escolha painéis, tipo de instalação, armazenamento e muito mais.
              </p>
            </div>
            <Button 
              onClick={() => setShowCalculator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              size="lg"
            >
              Calcular Preço
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Mais Popular
                </div>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              <div className="text-2xl font-bold text-green-600 mt-4">{plan.price}</div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full mt-6 ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                onClick={() => setShowCalculator(true)}
              >
                {plan.name === 'Industrial' ? 'Solicitar Orçamento' : 'Calcular Preço'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle>Por que escolher nossos sistemas?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Qualidade Garantida</h4>
              <p className="text-sm text-gray-600">Equipamentos de primeira linha com certificação internacional</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Preços Transparentes</h4>
              <p className="text-sm text-gray-600">Calculadora em tempo real sem surpresas ou taxas ocultas</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold mb-2">Instalação Premium</h4>
              <p className="text-sm text-gray-600">Equipe técnica especializada e acompanhamento completo</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowLeft className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Suporte Contínuo</h4>
              <p className="text-sm text-gray-600">Monitoramento e manutenção durante toda vida útil</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}