import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard' && (location === '/' || location === '/dashboard')) {
      return true;
    }
    return location.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Sun className="h-8 w-8 text-solar-orange" />
              <span className="text-2xl font-bold text-gray-900">
                AUTON<span className="text-solar-orange">®</span>
              </span>
              <Badge variant="secondary" className="text-xs">Enterprise</Badge>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/dashboard">
              <span className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                isActive('/dashboard') 
                  ? 'text-solar-orange border-b-2 border-solar-orange' 
                  : 'text-gray-700 hover:text-solar-orange'
              }`}>
                Dashboard
              </span>
            </Link>
            <Link href="/simulation">
              <span className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                isActive('/simulation') 
                  ? 'text-solar-orange border-b-2 border-solar-orange' 
                  : 'text-gray-700 hover:text-solar-orange'
              }`}>
                Simulações
              </span>
            </Link>
            <span className="text-gray-700 hover:text-solar-orange px-3 py-2 text-sm font-medium cursor-pointer">
              Relatórios
            </span>
            <span className="text-gray-700 hover:text-solar-orange px-3 py-2 text-sm font-medium cursor-pointer">
              Configurações
            </span>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{user?.name || 'Usuário'}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
