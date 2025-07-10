import OpenAI from "openai";
import type { Simulation, User } from "../../shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIAdviceRequest {
  context: 'simulation_analysis' | 'pricing_guidance' | 'technical_question' | 'general_advice';
  simulationData?: Simulation[];
  userProfile?: Partial<User>;
  specificQuestion?: string;
  systemConfiguration?: any;
}

export interface AIAdviceResponse {
  advice: string;
  recommendations: string[];
  technicalTips: string[];
  nextSteps: string[];
  confidence: number;
}

export class AIAdvisorService {
  
  async getContextualAdvice(request: AIAdviceRequest): Promise<AIAdviceResponse> {
    const systemPrompt = this.buildSystemPrompt(request.context);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        advice: result.advice || "Não foi possível gerar orientações específicas.",
        recommendations: result.recommendations || [],
        technicalTips: result.technicalTips || [],
        nextSteps: result.nextSteps || [],
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };

    } catch (error) {
      console.error('Erro ao gerar orientações IA:', error);
      return this.getFallbackAdvice(request.context);
    }
  }

  private buildSystemPrompt(context: string): string {
    const basePrompt = `Você é um especialista em energia solar fotovoltaica no Brasil, consultor técnico da AUTON®. 
    Sempre responda em português brasileiro de forma profissional e técnica, mas acessível.
    
    Suas respostas devem estar no formato JSON com as seguintes chaves:
    {
      "advice": "orientação principal detalhada",
      "recommendations": ["lista", "de", "recomendações", "específicas"],
      "technicalTips": ["dicas", "técnicas", "práticas"],
      "nextSteps": ["próximos", "passos", "sugeridos"],
      "confidence": 0.85
    }
    
    Use dados técnicos reais do mercado brasileiro:
    - Irradiação solar média: 4.5-6.5 kWh/m²/dia dependendo da região
    - Painéis típicos: 545-650Wp, eficiência 20-22%
    - Tarifa elétrica média: R$ 0.65-0.85/kWh
    - Vida útil sistema: 25+ anos
    - Payback típico: 3-7 anos`;

    switch (context) {
      case 'simulation_analysis':
        return basePrompt + `
        
        CONTEXTO: Análise de simulações solares existentes.
        Analise os dados fornecidos e identifique:
        - Eficiência energética e financeira
        - Oportunidades de otimização
        - Comparações entre diferentes cenários
        - Alertas sobre configurações inadequadas`;

      case 'pricing_guidance':
        return basePrompt + `
        
        CONTEXTO: Orientação sobre precificação de sistemas solares.
        Forneça insights sobre:
        - Custo-benefício da configuração
        - Comparação com mercado
        - Opções de financiamento
        - ROI e viabilidade financeira`;

      case 'technical_question':
        return basePrompt + `
        
        CONTEXTO: Resposta a pergunta técnica específica.
        Responda com precisão técnica sobre:
        - Especificações de equipamentos
        - Instalação e manutenção
        - Normas e regulamentações brasileiras
        - Melhores práticas da indústria`;

      case 'general_advice':
      default:
        return basePrompt + `
        
        CONTEXTO: Orientação geral sobre energia solar.
        Forneça guidance abrangente sobre:
        - Conceitos fundamentais
        - Processo de implementação
        - Benefícios e considerações
        - Primeiros passos recomendados`;
    }
  }

  private buildUserPrompt(request: AIAdviceRequest): string {
    let prompt = "";

    if (request.specificQuestion) {
      prompt += `Pergunta específica: ${request.specificQuestion}\n\n`;
    }

    if (request.userProfile) {
      prompt += `Perfil do usuário:\n`;
      if (request.userProfile.name) prompt += `- Nome: ${request.userProfile.name}\n`;
      if (request.userProfile.company) prompt += `- Empresa: ${request.userProfile.company}\n`;
      if (request.userProfile.plan) prompt += `- Plano: ${request.userProfile.plan}\n`;
    }

    if (request.simulationData && request.simulationData.length > 0) {
      prompt += `\nDados das simulações (${request.simulationData.length} simulações):\n`;
      
      request.simulationData.forEach((sim, index) => {
        prompt += `\nSimulação ${index + 1}:\n`;
        prompt += `- Nome: ${sim.name}\n`;
        prompt += `- Tipo: ${sim.type}\n`;
        if (sim.results) {
          const results = typeof sim.results === 'string' ? JSON.parse(sim.results) : sim.results;
          prompt += `- Potência: ${results.systemPower}kW\n`;
          prompt += `- Geração anual: ${results.annualGeneration}kWh\n`;
          prompt += `- Investimento: R$ ${results.totalInvestment}\n`;
          prompt += `- Payback: ${results.paybackYears} anos\n`;
          prompt += `- Economia anual: R$ ${results.annualSavings}\n`;
        }
      });
    }

    if (request.systemConfiguration) {
      prompt += `\nConfiguração do sistema em análise:\n`;
      prompt += JSON.stringify(request.systemConfiguration, null, 2);
    }

    if (!prompt.trim()) {
      prompt = "Forneça orientações gerais sobre energia solar fotovoltaica no Brasil.";
    }

    return prompt;
  }

  private getFallbackAdvice(context: string): AIAdviceResponse {
    const fallbacks = {
      simulation_analysis: {
        advice: "Para uma análise detalhada das simulações, considere fatores como irradiação solar local, consumo energético e área disponível.",
        recommendations: [
          "Verifique a irradiação solar da sua região",
          "Considere a orientação e inclinação do telhado",
          "Avalie o consumo energético histórico"
        ],
        technicalTips: [
          "Sistemas com orientação norte têm melhor performance",
          "Evite sombreamentos durante o dia",
          "Considere expansão futura do sistema"
        ],
        nextSteps: [
          "Revisar dados da simulação",
          "Consultar especialista técnico",
          "Solicitar visita técnica"
        ],
        confidence: 0.6
      },
      pricing_guidance: {
        advice: "O investimento em energia solar no Brasil tem payback médio de 4-6 anos, com economia de até 95% na conta de luz.",
        recommendations: [
          "Compare propostas de diferentes fornecedores",
          "Considere linhas de financiamento específicas",
          "Avalie custo-benefício a longo prazo"
        ],
        technicalTips: [
          "Equipamentos com certificação INMETRO",
          "Garantia mínima de 25 anos nos painéis",
          "Inversores com eficiência > 97%"
        ],
        nextSteps: [
          "Solicitar orçamentos detalhados",
          "Verificar linhas de crédito",
          "Planejar cronograma de instalação"
        ],
        confidence: 0.7
      },
      technical_question: {
        advice: "A energia solar fotovoltaica é uma tecnologia madura e confiável, ideal para o clima brasileiro.",
        recommendations: [
          "Consulte norma ABNT NBR 16274",
          "Verifique regulamentações da ANEEL",
          "Busque instaladores certificados"
        ],
        technicalTips: [
          "Manutenção preventiva anual",
          "Limpeza dos painéis conforme necessário",
          "Monitoramento contínuo da geração"
        ],
        nextSteps: [
          "Estudar documentação técnica",
          "Contactar especialistas",
          "Avaliar fornecedores locais"
        ],
        confidence: 0.5
      },
      general_advice: {
        advice: "A energia solar é um investimento inteligente no Brasil, oferecendo economia, sustentabilidade e valorização do imóvel.",
        recommendations: [
          "Inicie com uma simulação detalhada",
          "Analise seu perfil de consumo",
          "Considere incentivos fiscais disponíveis"
        ],
        technicalTips: [
          "Brasil tem excelente irradiação solar",
          "Marco legal favorável até 2045",
          "Tecnologia com 25+ anos de vida útil"
        ],
        nextSteps: [
          "Fazer simulação personalizada",
          "Pesquisar fornecedores locais",
          "Planejar investimento"
        ],
        confidence: 0.8
      }
    };

    return fallbacks[context as keyof typeof fallbacks] || fallbacks.general_advice;
  }

  async analyzeSimulationOptimization(simulation: Simulation): Promise<AIAdviceResponse> {
    if (!simulation.results) {
      return this.getFallbackAdvice('simulation_analysis');
    }

    const results = typeof simulation.results === 'string' 
      ? JSON.parse(simulation.results) 
      : simulation.results;

    return this.getContextualAdvice({
      context: 'simulation_analysis',
      simulationData: [simulation],
      specificQuestion: `Analise esta simulação e sugira otimizações para melhorar a eficiência e retorno do investimento. 
        Considere se o dimensionamento está adequado e se há oportunidades de melhoria.`
    });
  }

  async getPricingInsights(systemConfig: any, userBudget?: number): Promise<AIAdviceResponse> {
    let question = `Analise este sistema solar em termos de custo-benefício e viabilidade financeira.`;
    
    if (userBudget) {
      question += ` O orçamento disponível é de R$ ${userBudget.toLocaleString('pt-BR')}.`;
    }

    return this.getContextualAdvice({
      context: 'pricing_guidance',
      systemConfiguration: systemConfig,
      specificQuestion: question
    });
  }
}

export const aiAdvisor = new AIAdvisorService();