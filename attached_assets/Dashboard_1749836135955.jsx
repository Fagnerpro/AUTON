import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Car, 
  Building, 
  Sun,
  Plus,
  FileText,
  Users,
  Calculator
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function Dashboard() {
  const [stats, setStats] = useState({
    totalSimulations: 24,
    activeProjects: 8,
    totalSavings: 125000,
    totalPower: 850
  })

  const [recentSimulations] = useState([
    {
      id: 1,
      name: 'Residencial Vila Verde',
      type: 'residential',
      status: 'completed',
      power: 12.5,
      savings: 15000,
      date: '2024-12-05'
    },
    {
      id: 2,
      name: 'Condomínio Solar Park',
      type: 'ev_charging',
      status: 'draft',
      power: 45.0,
      savings: 35000,
      date: '2024-12-04'
    },
    {
      id: 3,
      name: 'Edifício Comercial Centro',
      type: 'commercial',
      status: 'completed',
      power: 85.5,
      savings: 75000,
      date: '2024-12-03'
    }
  ])

  const monthlyData = [
    { month: 'Jul', simulations: 12, power: 145 },
    { month: 'Ago', simulations: 18, power: 220 },
    { month: 'Set', simulations: 15, power: 185 },
    { month: 'Out', simulations: 22, power: 280 },
    { month: 'Nov', simulations: 28, power: 350 },
    { month: 'Dez', simulations: 24, power: 310 }
  ]

  const typeDistribution = [
    { name: 'Residencial', value: 45, color: '#f97316' },
    { name: 'Comercial', value: 30, color: '#3b82f6' },
    { name: 'Veículos Elétricos', value: 15, color: '#10b981' },
    { name: 'Áreas Comuns', value: 10, color: '#8b5cf6' }
  ]

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      draft: 'secondary',
      approved: 'default'
    }
    
    const labels = {
      completed: 'Concluído',
      draft: 'Rascunho',
      approved: 'Aprovado'
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const getTypeIcon = (type) => {
    const icons = {
      residential: Building,
      commercial: Building,
      ev_charging: Car,
      common_areas: Zap
    }
    
    const Icon = icons[type] || Building
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas simulações e projetos solares
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Nova Simulação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulações</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSimulations}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Economia anual estimada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potência Total</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPower} kWp</div>
            <p className="text-xs text-muted-foreground">
              Capacidade instalada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
            <CardDescription>
              Simulações e potência por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="simulations" fill="#f97316" name="Simulações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>
              Tipos de simulação mais utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Simulations */}
      <Card>
        <CardHeader>
          <CardTitle>Simulações Recentes</CardTitle>
          <CardDescription>
            Últimas simulações criadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSimulations.map((simulation) => (
              <div key={simulation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    {getTypeIcon(simulation.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{simulation.name}</h3>
                    <p className="text-sm text-gray-600">
                      {simulation.power} kWp • R$ {simulation.savings.toLocaleString()} economia/ano
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(simulation.status)}
                  <span className="text-sm text-gray-500">{simulation.date}</span>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

