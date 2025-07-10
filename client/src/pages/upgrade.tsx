import { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Crown, Zap, Calculator, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatCurrency } from '@/lib/utils';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ customAmount, isSystemPurchase }: { customAmount?: number | null, isSystemPurchase?: boolean }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Upgrade user account
        await apiRequest('POST', '/api/upgrade-to-premium', {
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: isSystemPurchase ? "Compra Realizada!" : "Upgrade Realizado!",
          description: isSystemPurchase 
            ? "Seu sistema solar foi adquirido com sucesso! Entraremos em contato para agendamento."
            : "Bem-vindo ao plano Premium! Agora você tem acesso ilimitado.",
        });

        // Clear pricing config if it was a system purchase
        if (isSystemPurchase) {
          localStorage.removeItem('pricingConfig');
        }

        // Redirect to dashboard
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erro no Upgrade",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Processando...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>
              {isSystemPurchase && customAmount
                ? `Confirmar Compra - ${formatCurrency(customAmount)}`
                : 'Confirmar Upgrade - R$ 24,90/mês'
              }
            </span>
          </div>
        )}
      </Button>
    </form>
  );
};

export default function Upgrade() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: 24.90 // R$ 24,90
    })
    .then((data) => {
      setClientSecret(data.clientSecret);
    })
    .catch((error) => {
      toast({
        title: "Erro",
        description: "Erro ao carregar pagamento",
        variant: "destructive",
      });
    });
  }, []);

  // Redirect if already premium
  if (user?.plan === 'premium') {
    setLocation('/dashboard');
    return null;
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade para Premium
          </h1>
          <p className="text-xl text-gray-600">
            Desbloqueie o potencial completo do AUTON®
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan comparison */}
          <div className="space-y-6">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-gray-500" />
                  <span>Plano Demo</span>
                </CardTitle>
                <CardDescription>Seu plano atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">Gratuito</div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    1 simulação
                  </li>
                  <li className="flex items-center text-gray-500">
                    <span className="w-4 h-4 mr-2">✗</span>
                    Relatórios limitados
                  </li>
                  <li className="flex items-center text-gray-500">
                    <span className="w-4 h-4 mr-2">✗</span>
                    Sem suporte técnico
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-orange-500" />
                  <span>Plano Premium</span>
                </CardTitle>
                <CardDescription>Acesso completo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4 text-orange-600">
                  R$ 24,90<span className="text-sm font-normal text-gray-500">/mês</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Simulações ilimitadas
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Relatórios completos (PDF, Excel, JSON)
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Suporte técnico prioritário
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Análises financeiras avançadas
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Projetos multi-unidades
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment form */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagamento</CardTitle>
              <CardDescription>
                Pagamento seguro processado pelo Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm customAmount={null} isSystemPurchase={false} />
              </Elements>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Pagamento seguro • Cancele a qualquer momento • Suporte 24/7
          </p>
        </div>
      </div>
    </div>
  );
}