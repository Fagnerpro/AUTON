import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { Simulation } from '@shared/schema';

export default function ReportsSafe() {
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({ type: null, text: '' });
  const isMounted = useRef(true);
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDownloadTime = useRef<number>(0);
  const lastGenerateTime = useRef<number>(0);

  // Component mount tracking
  useEffect(() => {
    isMounted.current = true;
    console.log('ReportsSafe component mounted');
    
    return () => {
      isMounted.current = false;
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        console.log('Download timeout cleared on unmount');
      }
      console.log('ReportsSafe component unmounted');
    };
  }, []);

  // Fetch user simulations
  const { data: simulations = [], isLoading, error } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
    enabled: isMounted.current,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    if (!isMounted.current) return;
    setMessage({ type, text });
  }, []);

  // Handle message timeout
  useEffect(() => {
    if (message.type) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setMessage({ type: null, text: '' });
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.type]);

  // Safe download function with proper cleanup
  const downloadFile = useCallback(async (blob: Blob, filename: string) => {
    if (!isMounted.current) {
      console.warn('Download attempted on unmounted component');
      return false;
    }

    const now = Date.now();
    if (now - lastDownloadTime.current < 1000) {
      console.warn('Download debounced - too rapid');
      return false;
    }
    lastDownloadTime.current = now;

    try {
      const url = URL.createObjectURL(blob);
      const linkId = `download-link-${crypto.randomUUID()}`;
      const link = document.createElement('a');
      link.id = linkId;
      link.href = url;
      link.download = filename;
      link.style.cssText = 'position: fixed; top: -9999px; left: -9999px; opacity: 0; pointer-events: none;';
      
      document.body.appendChild(link);
      link.click();

      downloadTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        try {
          const elementToRemove = document.getElementById(linkId);
          if (elementToRemove && document.body.contains(elementToRemove)) {
            document.body.removeChild(elementToRemove);
            console.log('Download link cleaned up:', linkId);
          }
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Download cleanup error:', cleanupError);
        }
      }, 2000);
      
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
        const filename = `relatorio-completo-${selectedSimulation}.${reportFormat}`;
        const success = await downloadFile(blob, filename);
        if (success) {
          showMessage('success', `Relatório ${reportFormat.toUpperCase()} gerado com sucesso!`);
        } else {
          showMessage('error', 'Erro ao processar o arquivo.');
        }
      } catch (error) {
        console.error('Report generation error:', error);
        showMessage('error', 'Erro ao processar o arquivo.');
      }
    },
    onError: (error) => {
      console.error('Report mutation error:', error);
      showMessage('error', 'Não foi possível gerar o relatório.');
    },
  });

  // Debounced report generation
  const handleGenerateReport = useCallback(() => {
    const now = Date.now();
    if (now - lastGenerateTime.current < 1000) {
      console.warn('Report generation debounced - too rapid');
      return;
    }
    lastGenerateTime.current = now;

    if (!selectedSimulation) {
      showMessage('error', 'Selecione uma simulação para gerar o relatório.');
      return;
    }

    generateReportMutation.mutate({
      simulationId: parseInt(selectedSimulation),
      format: reportFormat,
    });
  }, [selectedSimulation, reportFormat, generateReportMutation, showMessage]);

  const getViabilityInfo = useCallback((simulation: Simulation) => {
    if (!simulation.results) return { emoji: '⚠️', text: 'Sem cálculo', color: '#dc2626' };
    const payback = (simulation.results as any)?.payback_years;
    if (payback <= 5) return { emoji: '✅', text: 'Viável', color: '#059669' };
    if (payback <= 8) return { emoji: '⚡', text: 'Moderado', color: '#d97706' };
    return { emoji: '❌', text: 'Avaliar', color: '#dc2626' };
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', fontSize: '18px', color: '#666' }}>
        ⏳ Carregando simulações...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', textAlign: 'center' }}>
        ❌ Erro ao carregar simulações. Recarregue a página.
      </div>
    );
  }

  const selectedSim = simulations.find(s => s.id.toString() === selectedSimulation);

  return (
    <ErrorBoundary>
      <div key="reports-safe-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
        {/* Message Display */}
        {message.type && (
          <div key={`msg-${message.type}`} style={{
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
          }}>
            {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'} {message.text}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#1f2937' }}>
            📊 Relatórios AUTON
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '18px' }}>
            Gere relatórios completos das suas simulações solares
          </p>
        </div>

        {/* Selection and Format */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          {/* Simulation Selection */}
          <div style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' }}>
              📋 Selecionar Simulação
            </h2>
            <select 
              value={selectedSimulation} 
              onChange={(e) => setSelectedSimulation(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '16px', color: '#374151', outline: 'none', marginBottom: '20px' }}
            >
              <option value="">Selecione uma simulação...</option>
              {simulations.map((simulation) => (
                <option key={simulation.id} value={simulation.id.toString()}>
                  {simulation.name || `Simulação ${simulation.id}`}
                </option>
              ))}
            </select>
            {selectedSim && (
              <div style={{ padding: '20px', backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{selectedSim.name}</span>
                  <span style={{ background: getViabilityInfo(selectedSim).color, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
                    {getViabilityInfo(selectedSim).emoji} {getViabilityInfo(selectedSim).text}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  <strong>Tipo:</strong> {selectedSim.type} • <strong>Criado:</strong> {new Date(selectedSim.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' }}>
              💾 Formato do Relatório
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
                    outline: 'none'
                  }}
                  onClick={() => setReportFormat(format.value)}
                >
                  <span style={{ fontSize: '32px' }}>{format.icon}</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>{format.label}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{format.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
              🚀 Pronto para gerar!
            </h3>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              {selectedSimulation ? `Relatório ${reportFormat.toUpperCase()} será gerado com dados completos da simulação` : 'Selecione uma simulação para continuar'}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '0 auto',
              outline: 'none',
              transition: 'all 0.2s ease'
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
                📄 Gerar Relatório {reportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>

        {/* Available Simulations List */}
        {simulations.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '600', 
              margin: '0 0 24px 0',
              color: '#1f2937'
            }}>
              📋 Suas Simulações ({simulations.length})
            </h2>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {simulations.map((simulation) => {
                const viability = getViabilityInfo(simulation);
                const isSelected = selectedSimulation === simulation.id.toString();
                
                return (
                  <div
                    key={simulation.id}
                    style={{
                      padding: '16px 20px',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
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
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                        {simulation.name || `Simulação ${simulation.id}`}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {simulation.type} • {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {viability && (
                      <span style={{ 
                        background: viability.color, 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {viability.emoji} {viability.text}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CSS for spin animation */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    </ErrorBoundary>
  );
}