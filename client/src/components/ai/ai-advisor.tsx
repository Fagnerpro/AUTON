import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  Loader2,
  MessageSquare,
  TrendingUp,
  Settings
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation } from '../../../shared/schema';

interface AIAdviceResponse {
  advice: string;
  recommendations: string[];
  technicalTips: string[];
  nextSteps: string[];
  confidence: number;
}

interface AIAdvisorProps {
  context?: 'simulation_analysis' | 'pricing_guidance' | 'technical_question' | 'general_advice';
  simulationData?: Simulation[];
  systemConfiguration?: any;
  className?: string;
}

export default function AIAdvisor({ 
  context = 'general_advice', 
  simulationData, 
  systemConfiguration,
  className = ""
}: AIAdvisorProps) {
  const [question, setQuestion] = useState('');
  const [currentAdvice, setCurrentAdvice] = useState<AIAdviceResponse | null>(null);
  const { toast } = useToast();

  // Auto-generate advice when component loads with simulation data
  const { data: autoAdvice, isLoading: isAutoLoading, error: autoError } = useQuery({
    queryKey: ['ai-advice', context, simulationData?.length, systemConfiguration],
    queryFn: async () => {
      if (context === 'general_advice' && !simulationData?.length && !systemConfiguration) {
        return null;
      }
      
      const response = await apiRequest('POST', '/api/ai/advice', {
        context,
        simulationData,
        systemConfiguration
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro desconhecido');
      }
      
      return response.json();
    },
    enabled: !!(simulationData?.length || systemConfiguration || context !== 'general_advice'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false // Don't retry on subscription errors
  });

  // Manual question asking
  const askQuestionMutation = useMutation({
    mutationFn: async (specificQuestion: string) => {
      const response = await apiRequest('POST', '/api/ai/advice', {
        context: 'technical_question',
        specificQuestion,
        simulationData,
        systemConfiguration
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro desconhecido');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentAdvice(data);
      setQuestion('');
      toast({
        title: "Orientação gerada",
        description: "Recebi sua pergunta e preparei uma resposta personalizada."
      });
    },
    onError: (error: any) => {
      const message = error.message;
      if (message.includes("restrito para assinantes")) {
        toast({
          title: "🔒 Recurso Premium",
          description: "O Assistente IA está disponível apenas para assinantes Premium. Faça upgrade para ter acesso completo!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: message || "Erro ao processar sua pergunta.",
          variant: "destructive"
        });
      }
    }
  });

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Pergunta vazia",
        description: "Digite sua pergunta sobre energia solar.",
        variant: "destructive"
      });
      return;
    }
    askQuestionMutation.mutate(question);
  };

  const getContextIcon = () => {
    switch (context) {
      case 'simulation_analysis': return <TrendingUp className="h-5 w-5" />;
      case 'pricing_guidance': return <Target className="h-5 w-5" />;
      case 'technical_question': return <Settings className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case 'simulation_analysis': return 'Análise de Simulação';
      case 'pricing_guidance': return 'Orientação de Preços';
      case 'technical_question': return 'Suporte Técnico';
      default: return 'Assistente Solar IA';
    }
  };

  const displayAdvice = currentAdvice || autoAdvice;
  const isLoading = isAutoLoading || askQuestionMutation.isPending;
  const hasSubscriptionError = autoError?.message?.includes("restrito para assinantes");

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Assistant Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            {getContextIcon()}
            <span>{getContextTitle()}</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Brain className="h-3 w-3 mr-1" />
              IA
            </Badge>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Receba orientações personalizadas baseadas em análise inteligente dos seus dados
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Subscription Required Alert */}
      {hasSubscriptionError && (
        <Alert className="border-amber-200 bg-amber-50">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <div className="flex items-center justify-between">
              <span>🔒 <strong>Recurso Premium:</strong> O Assistente IA está disponível apenas para assinantes Premium.</span>
              <Button size="sm" variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-100">
                Fazer Upgrade
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Question Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>Faça uma Pergunta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ex: Como posso otimizar meu sistema solar? Qual o melhor tipo de painel para minha região? Vale a pena incluir armazenamento?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={handleAskQuestion}
            disabled={!question.trim() || askQuestionMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {askQuestionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Obter Orientação IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Advice Display */}
      {isLoading && !displayAdvice && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Analisando seus dados e gerando orientações...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {displayAdvice && (
        <div className="space-y-4">
          {/* Confidence Indicator */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 flex items-center justify-between">
              <span>Orientação gerada com {Math.round((displayAdvice.confidence || 0.5) * 100)}% de confiança</span>
              <Badge variant="outline" className="border-green-600 text-green-600">
                IA Specialist
              </Badge>
            </AlertDescription>
          </Alert>

          {/* Main Advice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>Orientação Principal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {displayAdvice.advice}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {displayAdvice.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Recomendações</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayAdvice.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Technical Tips */}
          {displayAdvice.technicalTips?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Dicas Técnicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayAdvice.technicalTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {displayAdvice.nextSteps?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                  <span>Próximos Passos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {displayAdvice.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orientações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => askQuestionMutation.mutate("Como posso maximizar a economia do meu sistema solar?")}
              disabled={askQuestionMutation.isPending}
            >
              Maximizar Economia
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => askQuestionMutation.mutate("Quais são as melhores práticas de manutenção para sistemas solares?")}
              disabled={askQuestionMutation.isPending}
            >
              Manutenção
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => askQuestionMutation.mutate("Como escolher o melhor fornecedor de energia solar?")}
              disabled={askQuestionMutation.isPending}
            >
              Escolher Fornecedor
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => askQuestionMutation.mutate("Quais incentivos fiscais estão disponíveis para energia solar?")}
              disabled={askQuestionMutation.isPending}
            >
              Incentivos Fiscais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}