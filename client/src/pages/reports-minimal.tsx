import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Simulation } from '@shared/schema';

// Componente isolado sem ErrorBoundary nem componentes externos
export default function ReportsMinimal() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({ type: null, text: '' });
  const isMounted = useRef(true);
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDownloadTime = useRef<number>(0);
  const lastGenerateTime = useRef<number>(0);
  const messageKey = useRef<string>('');

  // Component mount tracking
  useEffect(() => {
    isMounted.current = true;
    console.log('ReportsMinimal component mounted');
    
    return () => {
      isMounted.current = false;
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
      console.log('ReportsMinimal component unmounted');
    };
  }, []);

  // Fetch user simulations
  const { data: simulations = [], isLoading, error } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
    retry: 1,
    staleTime: 30000,
  });

  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    if (!isMounted.current) return;
    messageKey.current = `${type}-${Date.now()}`;
    setMessage({ type, text });
  }, []);

  // Handle message timeout with cleanup
  useEffect(() => {
    if (message.type) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setMessage({ type: null, text: '' });
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message.type]);

  // Safe download function
  const downloadFile = useCallback(async (blob: Blob, filename: string) => {
    if (!isMounted.current) return false;

    const now = Date.now();
    if (now - lastDownloadTime.current < 1500) {
      console.warn('Download debounced');
      return false;
    }
    lastDownloadTime.current = now;

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;';
      
      document.body.appendChild(link);
      link.click();

      // Cleanup com timeout mais longo
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  }, []);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { simulationId: number; format: string }) => {
      return apiRequest('POST', `/api/reports/generate`, data, { responseType: 'blob' });
    },
    onSuccess: async (response) => {
      try {
        const blob = await response.blob();
        const filename = `relatorio-${selectedSimulation}.${reportFormat}`;
        const success = await downloadFile(blob, filename);
        if (success) {
          showMessage('success', `Relatório ${reportFormat.toUpperCase()} baixado!`);
        } else {
          showMessage('error', 'Erro no download.');
        }
      } catch (error) {
        console.error('Report error:', error);
        showMessage('error', 'Erro ao gerar relatório.');
      }
    },
    onError: (error) => {
      console.error('Report mutation error:', error);
      showMessage('error', 'Falha na geração do relatório.');
    },
  });

  // Debounced report generation
  const handleGenerateReport = useCallback(() => {
    const now = Date.now();
    if (now - lastGenerateTime.current < 1500) {
      console.warn('Generate debounced');
      return;
    }
    lastGenerateTime.current = now;

    if (!selectedSimulation) {
      showMessage('error', 'Selecione uma simulação.');
      return;
    }

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
    });
  }, [selectedSimulation, reportFormat, generateReportMutation, showMessage]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666666'
      }}>
        Carregando simulações...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        textAlign: 'center',
        margin: '20px'
      }}>
        Erro ao carregar simulações. Recarregue a página.
      </div>
    );
  }

  const selectedSim = simulations.find(s => s.id.toString() === selectedSimulation);

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Message Display - Posicionamento fixo sem portal */}
      {message.type && (
        <div 
          key={messageKey.current}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fef2f2' : '#dbeafe',
            color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#dc2626' : '#1e40af',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
            zIndex: 9999,
            maxWidth: '350px',
            fontSize: '14px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {message.type === 'success' ? '✓' : message.type === 'error' ? '✗' : 'ℹ'} {message.text}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0', 
          color: '#111827' 
        }}>
          Relatórios AUTON
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '16px' 
        }}>
          Gere relatórios das suas simulações solares
        </p>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '24px', 
        marginBottom: '24px' 
      }}>
        {/* Simulation Selection */}
        <div style={{ 
          background: 'white', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            margin: '0 0 16px 0', 
            color: '#111827' 
          }}>
            Selecionar Simulação
          </h2>
          <select 
            value={selectedSimulation} 
            onChange={(e) => setSelectedSimulation(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px', 
              fontSize: '14px', 
              color: '#374151',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="">Escolha uma simulação...</option>
            {simulations.map((simulation) => (
              <option key={`sim-${simulation.id}`} value={simulation.id.toString()}>
                {simulation.name || `Simulação ${simulation.id}`}
              </option>
            ))}
          </select>
          
          {selectedSim && (
            <div style={{ 
              marginTop: '16px',
              padding: '16px', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '6px' 
            }}>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                {selectedSim.name}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                <strong>Tipo:</strong> {selectedSim.type} • <strong>Data:</strong> {new Date(selectedSim.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div style={{ 
          background: 'white', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            margin: '0 0 16px 0', 
            color: '#111827' 
          }}>
            Formato do Relatório
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { value: 'pdf', label: 'PDF', icon: '📄', color: '#dc2626' },
              { value: 'excel', label: 'Excel', icon: '📊', color: '#059669' },
              { value: 'json', label: 'JSON', icon: '💻', color: '#2563eb' }
            ].map((format) => (
              <button
                key={`fmt-${format.value}`}
                style={{
                  padding: '16px 8px',
                  border: reportFormat === format.value ? `2px solid ${format.color}` : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: reportFormat === format.value ? `${format.color}08` : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  outline: 'none',
                  fontSize: '13px'
                }}
                onClick={() => setReportFormat(format.value)}
              >
                <span style={{ fontSize: '24px' }}>{format.icon}</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>{format.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            margin: '0 0 4px 0',
            color: '#111827'
          }}>
            Gerar Relatório
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            {selectedSimulation ? 
              `Baixar relatório em formato ${reportFormat.toUpperCase()}` :
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
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (!selectedSimulation || generateReportMutation.isPending) ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {generateReportMutation.isPending ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
              Gerando...
            </>
          ) : (
            <>
              Gerar Relatório {reportFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>

      {/* Lista de Simulações */}
      {simulations.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 16px 0',
            color: '#111827'
          }}>
            Suas Simulações ({simulations.length})
          </h2>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            {simulations.map((simulation) => {
              const isSelected = selectedSimulation === simulation.id.toString();
              
              return (
                <div
                  key={`list-${simulation.id}`}
                  style={{
                    padding: '12px 16px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: isSelected ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedSimulation(simulation.id.toString())}
                >
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '2px' }}>
                      {simulation.name || `Simulação ${simulation.id}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {simulation.type} • {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {simulation.results && (
                    <span style={{ 
                      background: '#10b981', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      ✓ Calculado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CSS inline para animação */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}