import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import StatsCards from '@/components/dashboard/stats-cards';
import Charts from '@/components/dashboard/charts';
import RecentSimulations from '@/components/dashboard/recent-simulations';

export default function Dashboard() {
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
        <Link href="/simulation">
          <Button className="bg-solar-orange hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Simulação
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts */}
      <Charts />

      {/* Recent Simulations */}
      <RecentSimulations />
    </div>
  );
}
