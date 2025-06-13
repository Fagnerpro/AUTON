import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Sun, 
  Zap, 
  Building, 
  Car, 
  Calculator, 
  BarChart3,
  Settings,
  Users,
  FileText,
  Shield
} from 'lucide-react'
import './App.css'

// Componentes principais
import Dashboard from './components/Dashboard'
import SimulationForm from './components/SimulationForm'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} setUser={setCurrentUser} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Sun className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    AUTON<span className="text-orange-500">®</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">Enterprise</Badge>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                <a href="#dashboard" className="text-gray-700 hover:text-orange-500 px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#simulations" className="text-gray-700 hover:text-orange-500 px-3 py-2 text-sm font-medium">
                  Simulações
                </a>
                <a href="#reports" className="text-gray-700 hover:text-orange-500 px-3 py-2 text-sm font-medium">
                  Relatórios
                </a>
                <a href="#settings" className="text-gray-700 hover:text-orange-500 px-3 py-2 text-sm font-medium">
                  Configurações
                </a>
              </nav>

              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  {currentUser?.name || 'Usuário'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsAuthenticated(false)}
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/simulation" element={<SimulationForm />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sun className="h-6 w-6 text-orange-500" />
                  <span className="text-lg font-bold text-gray-900">AUTON® Enterprise</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Sistema avançado de simulação solar para empresas e profissionais do setor.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Funcionalidades</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Simulação Residencial</li>
                  <li>Recarga de Veículos Elétricos</li>
                  <li>Áreas Comuns</li>
                  <li>Análise Financeira</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Suporte</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Documentação</li>
                  <li>API Reference</li>
                  <li>Suporte Técnico</li>
                  <li>Treinamentos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">USINA I.A.</h3>
                <p className="text-sm text-gray-600">
                  Powered by USINA I.A. - Inteligência Artificial para o setor energético.
                </p>
              </div>
            </div>
            
            <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
              <p>&copy; 2024 USINA I.A. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App

