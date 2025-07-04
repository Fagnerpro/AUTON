import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  Zap, 
  Leaf, 
  Building2, 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp,
  Shield,
  Smartphone,
  Clock,
  CreditCard,
  FileText,
  BarChart3
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { registerSchema, loginSchema } from "@shared/schema";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { toast } = useToast();

  // Fetch plans for pricing section
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/plans"],
    retry: false,
  });

  // Auth mutations
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao AUTON®. Você já pode começar a simular.",
      });
      setIsAuthOpen(false);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no registro",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Login realizado!",
        description: `Bem-vindo de volta, ${data.user.name}!`,
      });
      setIsAuthOpen(false);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas.",
        variant: "destructive",
      });
    },
  });

  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (authMode === "login") {
      const validatedData = loginSchema.parse(data);
      loginMutation.mutate(validatedData);
    } else {
      const validatedData = registerSchema.parse(data);
      registerMutation.mutate(validatedData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AUTON®</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </a>
          </nav>
          <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
            <DialogTrigger asChild>
              <Button>Acessar Plataforma</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{authMode === "login" ? "Entrar" : "Criar Conta"}</DialogTitle>
                <DialogDescription>
                  {authMode === "login" 
                    ? "Entre com suas credenciais para acessar o AUTON®" 
                    : "Crie sua conta e comece a simular gratuitamente"
                  }
                </DialogDescription>
              </DialogHeader>
              <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Nome completo</Label>
                      <Input id="register-name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input id="register-email" name="email" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="register-company">Empresa (opcional)</Label>
                      <Input id="register-company" name="company" />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Senha</Label>
                      <Input id="register-password" name="password" type="password" required />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 A Plataforma Mais Avançada do Brasil
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Simulação Solar Empresarial
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AUTON® é a solução completa para construtoras, incorporadoras e empresas do setor solar. 
            Simule projetos multi-unidades, áreas comuns e estações de recarga com precisão técnica incomparável.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-lg px-8">
                  <Calculator className="mr-2 h-5 w-5" />
                  Começar Simulação Grátis
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <FileText className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5,000+</div>
              <div className="text-muted-foreground">Simulações realizadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground">Precisão técnica</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">Empresas atendidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Por que escolher o AUTON®?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A única plataforma que oferece simulação completa para projetos empresariais complexos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Building2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Projetos Multi-Unidades</CardTitle>
                <CardDescription>
                  Simule condomínios, edifícios comerciais e complexos residenciais com cálculos automáticos por unidade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Estações de Recarga VE</CardTitle>
                <CardDescription>
                  Integre estações de carregamento para veículos elétricos com dimensionamento preciso de energia
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Áreas Comuns</CardTitle>
                <CardDescription>
                  Calcule iluminação, elevadores, piscinas e sistemas de segurança com consumo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Análise Financeira Completa</CardTitle>
                <CardDescription>
                  ROI, payback, fluxo de caixa e análise de viabilidade com dados reais do mercado brasileiro
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Dados Técnicos Precisos</CardTitle>
                <CardDescription>
                  Irradiação solar por região, eficiência real dos sistemas e fatores climáticos atualizados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Relatórios Profissionais</CardTitle>
                <CardDescription>
                  Gere relatórios em PDF, Excel e JSON com logotipo da sua empresa e dados técnicos completos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Planos transparentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e evolua conforme sua necessidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                <div className="text-4xl font-bold">R$ 0</div>
                <div className="text-muted-foreground">/mês</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    5 simulações por mês
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Todos os tipos de cálculo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Relatórios básicos (PDF, Excel)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Suporte por email
                  </li>
                </ul>
                <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      Começar grátis
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary">Mais Popular</Badge>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Plano Premium</CardTitle>
                <div className="text-4xl font-bold">R$ 24,90</div>
                <div className="text-muted-foreground">/mês</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Simulações ilimitadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Relatórios personalizados com logo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Exportação em todos os formatos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    API para integração
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Histórico completo
                  </li>
                </ul>
                <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Começar Premium
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Sobre o AUTON®
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desenvolvido por especialistas em energia solar com foco em projetos empresariais complexos. 
              Nossa missão é democratizar o acesso à energia solar através de tecnologia de ponta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Tecnologia de ponta</h3>
              <p className="text-muted-foreground mb-6">
                Utilizamos algoritmos avançados baseados em dados reais de irradiação solar, 
                fatores climáticos regionais e eficiência comprovada de equipamentos para 
                garantir simulações precisas e confiáveis.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-3" />
                  <span>Cálculos em tempo real</span>
                </div>
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-primary mr-3" />
                  <span>Interface responsiva e intuitiva</span>
                </div>
                <div className="flex items-center">
                  <Leaf className="h-5 w-5 text-primary mr-3" />
                  <span>Impacto ambiental calculado</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-lg p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h4 className="text-xl font-bold">Resultados comprovados</h4>
                  <p className="text-muted-foreground">
                    Mais de 5.000 simulações realizadas com 98% de precisão
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">R$ 2.5M+</div>
                    <div className="text-sm text-muted-foreground">Economia gerada</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">MW simulados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Pronto para revolucionar seus projetos solares?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já confiam no AUTON® para seus projetos de energia solar
          </p>
          <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-8">
                <Star className="mr-2 h-5 w-5" />
                Começar agora - É grátis!
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">AUTON®</span>
              </div>
              <p className="text-muted-foreground">
                A plataforma mais avançada para simulação solar empresarial do Brasil.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Centro de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 AUTON®. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}