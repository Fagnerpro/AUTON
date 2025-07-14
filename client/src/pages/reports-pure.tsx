import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Simulation } from '@shared/schema';

export default function ReportsPure() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({ type: null, text: '' });

  // Fetch user simulations
  const { data: simulations = [], isLoading, error } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

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
        
        showMessage('success', `Relatório ${reportFormat.toUpperCase()} gerado com sucesso!`);
      } catch (error) {
        showMessage('error', 'Erro ao processar o arquivo.');
      }
    },
    onError: () => {
      showMessage('error', 'Não foi possível gerar o relatório.');
    },
  });

  const handleGenerateReport = () => {
    if (!selectedSimulation) {
      showMessage('error', 'Selecione uma simulação para gerar o relatório.');
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
        height: '300px',
        fontSize: '18px',
        color: '#666'
      }}>
        ⏳ Carregando simulações...
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
        color: '#dc2626',
        textAlign: 'center'
      }}>
        ❌ Erro ao carregar simulações. Recarregue a página.
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Message Display */}
      {message.type && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#dbeafe',
          color: message.type === 'success' ? '#065f46' : message.type === 'error' ? '#dc2626' : '#1e40af',
          border: `1px solid ${message.type === 'success' ? '#10b981' : message.type === 'error' ? '#ef4444' : '#3b82f6'}`,
          zIndex: 1000,
          maxWidth: '400px',
          wordWrap: 'break-word'
        }}>
          {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'} {message.text}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: 'bold', 
          margin: '0 0 12px 0', 
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📊 Relatórios AUTON
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '18px' 
        }}>
          Gere relatórios completos das suas simulações solares
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Seleção da Simulação */}
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 20px 0', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Selecionar Simulação
          </h2>
          
          <select 
            value={selectedSimulation} 
            onChange={(e) => setSelectedSimulation(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              fontSize: '16px',
              color: '#374151',
              outline: 'none',
              transition: 'border-color 0.2s',
              marginBottom: '20px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
              padding: '20px',
              backgroundColor: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '8px'
            }}>
              {(() => {
                const sim = simulations.find(s => s.id.toString() === selectedSimulation);
                if (!sim) return null;
                
                const getViabilityInfo = (simulation: Simulation) => {
                  if (!simulation.results) return { emoji: '⚠️', text: 'Sem cálculo', color: '#dc2626' };
                  const payback = (simulation.results as any)?.payback_years;
                  if (payback <= 5) return { emoji: '✅', text: 'Viável', color: '#059669' };
                  if (payback <= 8) return { emoji: '⚡', text: 'Moderado', color: '#d97706' };
                  return { emoji: '❌', text: 'Avaliar', color: '#dc2626' };
                };

                const viability = getViabilityInfo(sim);

                return (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <span style={{ fontWeight: '600', fontSize: '18px' }}>{sim.name}</span>
                      <span style={{ 
                        background: viability.color, 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {viability.emoji} {viability.text}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      <strong>Tipo:</strong> {sim.type} • <strong>Criado:</strong> {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Formato do Relatório */}
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 20px 0', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💾 Formato do Relatório
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            {[
              { value: 'pdf', label: 'PDF', desc: 'Apresentação', icon: '📄', color: '#dc2626' },
              { value: 'excel', label: 'Excel', desc: 'Dados', icon: '📊', color: '#059669' },
              { value: 'json', label: 'JSON', desc: 'API', icon: '💻', color: '#2563eb' }
            ].map((format) => (
              <button
                key={format.value}
                style={{
                  padding: '20px 16px',
                  border: reportFormat === format.value ? `3px solid ${format.color}` : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: reportFormat === format.value ? `${format.color}10` : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onClick={() => setReportFormat(format.value)}
                onMouseOver={(e) => {
                  if (reportFormat !== format.value) {
                    e.currentTarget.style.borderColor = format.color;
                    e.currentTarget.style.background = `${format.color}05`;
                  }
                }}
                onMouseOut={(e) => {
                  if (reportFormat !== format.value) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <span style={{ fontSize: '32px' }}>{format.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>{format.label}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{format.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Botão de Gerar */}
      <div style={{
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 8px 0',
            color: '#1f2937'
          }}>
            🚀 Pronto para gerar!
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            {selectedSimulation ? 
              `Relatório ${reportFormat.toUpperCase()} será gerado com dados completos da simulação` :
              'Selecione uma simulação para continuar'
            }
          </p>
        </div>

        <button 
          onClick={handleGenerateReport}
          disabled={!selectedSimulation || generateReportMutation.isPending}
          style={{
            background: (!selectedSimulation || generateReportMutation.isPending) 
              ? '#9ca3af' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '20px 40px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: (!selectedSimulation || generateReportMutation.isPending) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: (!selectedSimulation || generateReportMutation.isPending) ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 auto',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            if (!(!selectedSimulation || generateReportMutation.isPending)) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseOut={(e) => {
            if (!(!selectedSimulation || generateReportMutation.isPending)) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }
          }}
        >
          {generateReportMutation.isPending ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Gerando Relatório...
            </>
          ) : (
            <>
              📥 Gerar Relatório {reportFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>

      {/* Lista de Simulações */}
      {simulations.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginTop: '32px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 8px 0', 
            color: '#1f2937' 
          }}>
            📋 Suas Simulações ({simulations.length})
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280', 
            margin: '0 0 24px 0' 
          }}>
            Clique em qualquer simulação para selecioná-la
          </p>
          
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {simulations.map((simulation) => {
              const getViabilityInfo = (simulation: Simulation) => {
                if (!simulation.results) return { emoji: '⚠️', text: 'Sem cálculo', color: '#dc2626' };
                const payback = (simulation.results as any)?.payback_years;
                if (payback <= 5) return { emoji: '✅', text: 'Viável', color: '#059669' };
                if (payback <= 8) return { emoji: '⚡', text: 'Moderado', color: '#d97706' };
                return { emoji: '❌', text: 'Avaliar', color: '#dc2626' };
              };

              const viability = getViabilityInfo(simulation);
              const isSelected = selectedSimulation === simulation.id.toString();

              return (
                <div 
                  key={simulation.id} 
                  style={{
                    padding: '20px',
                    border: isSelected ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isSelected ? '#f0f9ff' : 'white'
                  }}
                  onClick={() => setSelectedSimulation(simulation.id.toString())}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '6px', 
                        fontSize: '18px',
                        color: '#1f2937'
                      }}>
                        {simulation.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        <strong>Tipo:</strong> {simulation.type} • <strong>Criado:</strong> {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px' 
                    }}>
                      <span style={{ 
                        background: viability.color, 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {viability.emoji} {viability.text}
                      </span>
                      {simulation.results && (
                        <span style={{ color: '#22c55e', fontSize: '24px' }}>✅</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}