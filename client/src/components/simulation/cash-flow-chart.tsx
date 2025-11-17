import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from "lucide-react";

interface CashFlowData {
  month: number;
  monthlyFlow: number;
  accumulatedFlow: number;
  savings: number;
  investment: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  totalInvestment: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          Mês {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data, totalInvestment }: CashFlowChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Find breakeven point (when accumulated flow becomes positive)
  const breakevenMonth = data.find(d => d.accumulatedFlow >= 0)?.month || null;
  const finalAccumulated = data[data.length - 1]?.accumulatedFlow || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-cash-investment">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Investimento Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-investment-value">
                {formatCurrency(totalInvestment)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cash-breakeven">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Retorno do Investimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-breakeven-month">
                {breakevenMonth ? `${breakevenMonth} meses` : 'Calculando...'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cash-accumulated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Acumulado em 24 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${finalAccumulated >= 0 ? 'text-green-500' : 'text-orange-500'}`} />
              <span className={`text-2xl font-bold ${finalAccumulated >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} data-testid="text-accumulated-value">
                {formatCurrency(finalAccumulated)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accumulated Cash Flow Chart */}
      <Card data-testid="card-accumulated-chart">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Fluxo de Caixa Acumulado</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Evolução do retorno financeiro ao longo de 24 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Mês', position: 'insideBottom', offset: -5 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              {breakevenMonth && (
                <ReferenceLine 
                  x={breakevenMonth} 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  label={{ value: 'Ponto de Equilíbrio', position: 'top' }}
                />
              )}
              <Area 
                type="monotone" 
                dataKey="accumulatedFlow" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAccumulated)" 
                name="Fluxo Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Flow Chart */}
      <Card data-testid="card-monthly-chart">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Fluxo de Caixa Mensal</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Economia mensal (barras verdes) vs. investimento inicial (barra vermelha)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Mês', position: 'insideBottom', offset: -5 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="monthlyFlow" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                name="Fluxo Mensal"
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Economia Mensal"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
