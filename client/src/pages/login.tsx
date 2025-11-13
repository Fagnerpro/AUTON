import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Mail, Lock, User, Building2, TestTube } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { LoginRequest, RegisterRequest } from '@shared/schema';

export default function Login() {
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    company: ''
  });

  const demoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/demo", {});
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Modo demonstração ativado!",
        description: "Explore o AUTON® com 1 simulação gratuita para teste.",
      });
      window.location.reload(); // Force reload to update auth state
    },
    onError: (error: any) => {
      toast({
        title: "Erro no modo demo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const adminMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/admin", {});
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Acesso Admin Ativado!",
        description: "Modo Premium desbloqueado para testes.",
      });
      window.location.reload(); // Force reload to update auth state
    },
    onError: (error: any) => {
      toast({
        title: "Erro no modo admin",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDemo = () => demoMutation.mutate();
  const handleAdmin = () => adminMutation.mutate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(loginData);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(registerData);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sun className="h-12 w-12 text-primary" />
            <span className="text-3xl font-bold text-gray-900">
              AUTON<span className="text-primary">®</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema Empresarial
          </h1>
          <p className="text-gray-600">
            Simulação Solar Avançada
          </p>
        </div>

        {/* Card de Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre ou crie sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Registrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        name="name"
                        placeholder="Seu nome completo"
                        value={registerData.name}
                        onChange={handleRegisterChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-company">Empresa (opcional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-company"
                        name="company"
                        placeholder="Nome da empresa"
                        value={registerData.company}
                        onChange={handleRegisterChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Modo Demo */}
            <div className="mt-6 pt-6 border-t space-y-3">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleDemo}
                disabled={demoMutation.isPending}
              >
                <TestTube className="mr-2 h-4 w-4" />
                {demoMutation.isPending ? 'Carregando Demo...' : 'Testar Sistema (Demo)'}
              </Button>
              <Button 
                variant="secondary" 
                className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100" 
                onClick={handleAdmin}
                disabled={adminMutation.isPending}
              >
                {adminMutation.isPending ? 'Ativando...' : 'Acesso Admin (Premium)'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Demo: 1 simulação | Admin: Acesso completo para testes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>&copy; 2025 AUTON®. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}