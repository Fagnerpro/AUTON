import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Jul', simulations: 12, power: 145 },
  { month: 'Ago', simulations: 18, power: 220 },
  { month: 'Set', simulations: 15, power: 185 },
  { month: 'Out', simulations: 22, power: 280 },
  { month: 'Nov', simulations: 28, power: 350 },
  { month: 'Dez', simulations: 24, power: 310 }
];

const typeDistribution = [
  { name: 'Residencial', value: 45, color: '#f97316' },
  { name: 'Comercial', value: 30, color: '#3b82f6' },
  { name: 'Veículos Elétricos', value: 15, color: '#10b981' },
  { name: 'Áreas Comuns', value: 10, color: '#8b5cf6' }
];

export default function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Performance Chart */}
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

      {/* Type Distribution Chart */}
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
  );
}
