import { apiRequest } from "./queryClient";
import type { LoginRequest, RegisterRequest, User } from "@shared/schema";

export interface AuthResponse {
  token: string;
  user: Omit<User, 'hashedPassword'>;
}

export class AuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      
      return response;
    } catch (error: any) {
      if (error.message.includes('401')) {
        throw new AuthError('Email ou senha incorretos', 401);
      }
      throw new AuthError('Erro ao fazer login');
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new AuthError('Email já cadastrado', 409);
      }
      throw new AuthError('Erro ao criar conta');
    }
  },

  async getCurrentUser(): Promise<Omit<User, 'hashedPassword'> | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.logout();
          return null;
        }
        throw new Error('Failed to get user');
      }

      return await response.json();
    } catch (error) {
      this.logout();
      return null;
    }
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
