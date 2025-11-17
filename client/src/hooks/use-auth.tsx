import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { LoginRequest, RegisterRequest } from '@shared/schema';
import type { AuthResponse, UserInfoResponse } from '@shared/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserInfoResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const currentUser: UserInfoResponse = await response.json();
            setUser(currentUser);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiRequest('POST', '/api/auth/login', credentials);
      
      localStorage.setItem('token', response.token);
      
      // Fetch full user info with access data
      const userResponse: UserInfoResponse = await apiRequest('GET', '/api/auth/me');
      setUser(userResponse);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${response.user.name}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiRequest('POST', '/api/auth/register', userData);
      
      localStorage.setItem('token', response.token);
      
      // Fetch full user info with access data
      const userResponse: UserInfoResponse = await apiRequest('GET', '/api/auth/me');
      setUser(userResponse);
      
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo(a), ${response.user.name}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message || "Erro no registro",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
