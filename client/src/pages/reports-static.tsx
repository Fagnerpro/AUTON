import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Simulation } from '@shared/schema';

// Versão estática completamente isolada para evitar erros de reconciliação
export default function ReportsStatic() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const mountedRef = useRef(true);

  // Carregar simulações de forma independente
  useEffect(() => {
    const loadSimulations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/simulations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (mountedRef.current) {
            setSimulations(data);
            setError(null);
          }
        } else {
          throw new Error('Erro ao carregar simulações');
        }
      } catch (err) {
        if (mountedRef.current) {
          setError('Erro ao carregar simulações');
          console.error('Load error:', err);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadSimulations();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função de download nativa
  const downloadFile = async (blob: Blob, filename: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  // Função de geração de relatório
  const generateReport = async () => {
    if (!selectedSimulation || isGenerating) return;
    
    try {
      setIsGenerating(true);
      setMessage('Gerando relatório...');
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulationId: parseInt(selectedSimulation),
          format: reportFormat
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const filename = `relatorio-${selectedSimulation}.${reportFormat}`;
        const success = await downloadFile(blob, filename);
        
        if (success) {
          setMessage(`Relatório ${reportFormat.toUpperCase()} baixado com sucesso!`);
        } else {
          setMessage('Erro no download do arquivo');
        }
      } else {
        throw new Error('Erro na geração do relatório');
      }
    } catch (error) {
      setMessage('Erro ao gerar relatório');
      console.error('Report error:', error);
    } finally {
      setIsGenerating(false);
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          setMessage('');
        }
      }, 3000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#6b7280'
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
        {error}. Recarregue a página.
      </div>
    );
  }

  const selectedSim = simulations.find(s => s.id.toString() === selectedSimulation);

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Mensagem flutuante */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          borderRadius: '6px',
          backgroundColor: message.includes('sucesso') ? '#d1fae5' : '#fef2f2',
          color: message.includes('sucesso') ? '#065f46' : '#dc2626',
          border: `1px solid ${message.includes('sucesso') ? '#10b981' : '#ef4444'}`,
          zIndex: 9999,
          maxWidth: '300px',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '32px',
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

      {/* Formulário de seleção */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
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
            backgroundColor: 'white',
            marginBottom: '16px'
          }}
        >
          <option value="">Escolha uma simulação...</option>
          {simulations.map((simulation) => (
            <option key={simulation.id} value={simulation.id.toString()}>
              {simulation.name || `Simulação ${simulation.id}`}
            </option>
          ))}
        </select>

        {selectedSim && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
              {selectedSim.name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              <strong>Tipo:</strong> {selectedSim.type} • <strong>Data:</strong> {new Date(selectedSim.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}

        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '16px 0 12px 0',
          color: '#111827'
        }}>
          Formato do Relatório
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {[
            { value: 'pdf', label: 'PDF', icon: '📄' },
            { value: 'excel', label: 'Excel', icon: '📊' },
            { value: 'json', label: 'JSON', icon: '💻' }
          ].map((format) => (
            <button
              key={format.value}
              onClick={() => setReportFormat(format.value)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: reportFormat === format.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '6px',
                background: reportFormat === format.value ? '#eff6ff' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                outline: 'none',
                fontSize: '14px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{format.icon}</span>
              <span style={{ fontWeight: '500' }}>{format.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={generateReport}
          disabled={!selectedSimulation || isGenerating}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: (!selectedSimulation || isGenerating) ? '#9ca3af' : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            cursor: (!selectedSimulation || isGenerating) ? 'not-allowed' : 'pointer',
            outline: 'none'
          }}
        >
          {isGenerating ? 'Gerando...' : `Gerar Relatório ${reportFormat.toUpperCase()}`}
        </button>
      </div>

      {/* Lista de simulações */}
      {simulations.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '20px',
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
                  key={simulation.id}
                  onClick={() => setSelectedSimulation(simulation.id.toString())}
                  style={{
                    padding: '12px 16px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: isSelected ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
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
    </div>
  );
}