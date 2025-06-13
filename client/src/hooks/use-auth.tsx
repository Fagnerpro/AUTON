import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type AuthError } from '@/lib/auth';
import type { LoginRequest, RegisterRequest, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: Omit<User, 'hashedPassword'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'hashedPassword'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!authService.getToken();

  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${loggedInUser.name}!`,
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: authError.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const { user: newUser } = await authService.register(userData);
      setUser(newUser);
      
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo(a), ${newUser.name}!`,
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: authError.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
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
