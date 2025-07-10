import AIAdvisor from '@/components/ai/ai-advisor';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target } from 'lucide-react';

export default function AIAdvisorPage() {
  const { user } = useAuth();

  const { data: userSimulations } = useQuery({
    queryKey: ['/api/simulations'],
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Assistente Solar IA
          </h1>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Sparkles className="h-3 w-3 mr-1" />
            BETA
          </Badge>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Receba orientações personalizadas e insights inteligentes sobre energia solar 
          baseados em análise avançada dos seus dados e projetos
        </p>
      </div>

      {/* Key Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Target className="h-5 w-5" />
              <span>Análise Contextual</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Analisa suas simulações e fornece recomendações específicas para otimização
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-900">
              <Brain className="h-5 w-5" />
              <span>Suporte Técnico</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Responde perguntas técnicas sobre energia solar com base em dados reais
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-900">
              <Sparkles className="h-5 w-5" />
              <span>Insights de Preços</span>
            </CardTitle>
            <CardDescription className="text-purple-700">
              Avalia custo-benefício e sugere otimizações financeiras para seu projeto
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* AI Advisor Component */}
      <AIAdvisor 
        context="general_advice"
        simulationData={userSimulations}
        className="max-w-5xl mx-auto"
      />

      {/* Usage Guidelines */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Como usar o Assistente IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-amber-800">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Perguntas Recomendadas:</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Como posso otimizar meu sistema solar?"</li>
                <li>• "Qual o melhor tipo de painel para minha região?"</li>
                <li>• "Vale a pena incluir armazenamento de energia?"</li>
                <li>• "Como escolher um bom fornecedor?"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Análise automática de simulações existentes</li>
                <li>• Respostas baseadas em dados técnicos reais</li>
                <li>• Recomendações personalizadas por região</li>
                <li>• Suporte contextual por tipo de projeto</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}