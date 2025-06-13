import { Sun } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sun className="h-6 w-6 text-solar-orange" />
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
  );
}
