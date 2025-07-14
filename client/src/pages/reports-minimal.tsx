import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Simulation } from '@shared/schema';

export default function ReportsMinimal() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const { toast } = useToast();

  // Fetch user simulations
  const { data: simulations = [], isLoading, error } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { 
      simulationId: number; 
      format: string; 
    }) => {
      return apiRequest('POST', `/api/reports/generate`, data, { responseType: 'blob' });
    },
    onSuccess: async (response) => {
      try {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-completo-${selectedSimulation}.${reportFormat}`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          try {
            if (a.parentNode) {
              a.parentNode.removeChild(a);
            }
            window.URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 100);
        
        toast({
          title: "✅ Relatório gerado com sucesso!",
          description: `Download do arquivo ${reportFormat.toUpperCase()} iniciado.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no download",
          description: "Erro ao processar o arquivo.",
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório.",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedSimulation) {
      toast({
        variant: "destructive",
        title: "⚠️ Simulação necessária",
        description: "Selecione uma simulação para gerar o relatório.",
      });
      return;
    }

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
    });
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px' 
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626'
      }}>
        Erro ao carregar simulações. Tente recarregar a página.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background: #2563eb;
        }
        .btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .btn-outline {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .btn-outline:hover {
          background: #f9fafb;
        }
        .btn-active {
          background: #3b82f6;
          color: white;
        }
        .select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 14px;
        }
        .select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .grid {
          display: grid;
          gap: 16px;
        }
        .grid-2 {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .badge-success {
          background: #dcfce7;
          color: #166534;
        }
        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-danger {
          background: #fee2e2;
          color: #dc2626;
        }
        .sim-item {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sim-item:hover {
          border-color: #d1d5db;
        }
        .sim-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>
          📊 Relatórios
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Gere relatórios completos das suas simulações solares
        </p>
      </div>

      <div className="grid grid-2">
        {/* Seleção da Simulação */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827' }}>
            📋 Selecionar Simulação
          </h2>
          
          <select 
            className="select"
            value={selectedSimulation} 
            onChange={(e) => setSelectedSimulation(e.target.value)}
            style={{ marginBottom: '16px' }}
          >
            <option value="">Selecione uma simulação...</option>
            {simulations.length > 0 ? (
              simulations.map((simulation) => (
                <option 
                  key={simulation.id} 
                  value={simulation.id.toString()}
                >
                  {simulation.name || `Simulação ${simulation.id}`}
                </option>
              ))
            ) : (
              <option value="empty" disabled>
                Nenhuma simulação encontrada
              </option>
            )}
          </select>

          {selectedSimulation && (
            <div style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px'
            }}>
              {(() => {
                const sim = simulations.find(s => s.id.toString() === selectedSimulation);
                if (!sim) return null;
                
                const getBadgeClass = (simulation: Simulation) => {
                  if (!simulation.results) return 'badge badge-danger';
                  const payback = (simulation.results as any)?.payback_years;
                  if (payback <= 5) return 'badge badge-success';
                  if (payback <= 8) return 'badge badge-warning';
                  return 'badge badge-danger';
                };
                
                const getBadgeText = (simulation: Simulation) => {
                  if (!simulation.results) return 'Sem cálculo';
                  const payback = (simulation.results as any)?.payback_years;
                  if (payback <= 5) return 'Viável';
                  if (payback <= 8) return 'Moderado';
                  return 'Avaliar';
                };

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{sim.name}</span>
                      <span className={getBadgeClass(sim)}>{getBadgeText(sim)}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Tipo: {sim.type} • Criado em: {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Formato do Relatório */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827' }}>
            💾 Formato do Relatório
          </h2>
          
          <div className="grid grid-3">
            {[
              { value: 'pdf', label: 'PDF', desc: 'Apresentação', icon: '📄' },
              { value: 'excel', label: 'Excel', desc: 'Dados', icon: '📊' },
              { value: 'json', label: 'JSON', desc: 'API', icon: '💻' }
            ].map((format) => (
              <button
                key={format.value}
                className={`btn ${reportFormat === format.value ? 'btn-active' : 'btn-outline'}`}
                style={{
                  height: 'auto',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setReportFormat(format.value)}
              >
                <span style={{ fontSize: '20px' }}>{format.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{format.label}</span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>{format.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Botão de Gerar */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px 0' }}>
              🚀 Pronto para gerar!
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {selectedSimulation ? 
                `Relatório ${reportFormat.toUpperCase()} será gerado com dados completos da simulação` :
                'Selecione uma simulação para continuar'
              }
            </p>
          </div>
          <button 
            className="btn"
            onClick={handleGenerateReport}
            disabled={!selectedSimulation || generateReportMutation.isPending}
            style={{
              background: generateReportMutation.isPending 
                ? '#9ca3af' 
                : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              fontSize: '16px',
              padding: '16px 32px'
            }}
          >
            {generateReportMutation.isPending ? (
              <>
                <div style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Gerando...
              </>
            ) : (
              <>
                📥 Gerar Relatório
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Simulações */}
      {simulations.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827' }}>
            📋 Suas Simulações
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
            Lista completa das simulações disponíveis para relatórios
          </p>
          
          <div className="grid" style={{ gap: '12px' }}>
            {simulations.map((simulation) => {
              const getBadgeClass = (simulation: Simulation) => {
                if (!simulation.results) return 'badge badge-danger';
                const payback = (simulation.results as any)?.payback_years;
                if (payback <= 5) return 'badge badge-success';
                if (payback <= 8) return 'badge badge-warning';
                return 'badge badge-danger';
              };
              
              const getBadgeText = (simulation: Simulation) => {
                if (!simulation.results) return 'Sem cálculo';
                const payback = (simulation.results as any)?.payback_years;
                if (payback <= 5) return 'Viável';
                if (payback <= 8) return 'Moderado';
                return 'Avaliar';
              };

              return (
                <div 
                  key={simulation.id} 
                  className={`sim-item ${selectedSimulation === simulation.id.toString() ? 'selected' : ''}`}
                  onClick={() => setSelectedSimulation(simulation.id.toString())}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {simulation.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {simulation.type} • {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={getBadgeClass(simulation)}>{getBadgeText(simulation)}</span>
                      {simulation.results && <span style={{ color: '#22c55e', fontSize: '18px' }}>✅</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}