import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SafeSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-safe';
import { SafeTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-safe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDOMStability() {
  const [selectOpen, setSelectOpen] = useState(false);
  const [tabValue, setTabValue] = useState('tab1');
  const [testCount, setTestCount] = useState(0);

  const handleStressTest = () => {
    // Teste de stress para verificar estabilidade DOM
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        setSelectOpen(prev => !prev);
        setTabValue(prev => prev === 'tab1' ? 'tab2' : 'tab1');
        setTestCount(prev => prev + 1);
      }, i * 100);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Teste de Estabilidade DOM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Select Seguro</h3>
          <Select value="test" onValueChange={() => {}}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Opção 1</SelectItem>
              <SelectItem value="option2">Opção 2</SelectItem>
              <SelectItem value="option3">Opção 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Tabs Seguros</h3>
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <div className="p-4 bg-blue-50 rounded">
                Conteúdo da Tab 1 - Animação segura implementada
              </div>
            </TabsContent>
            <TabsContent value="tab2">
              <div className="p-4 bg-green-50 rounded">
                Conteúdo da Tab 2 - Portal cleanup automático
              </div>
            </TabsContent>
            <TabsContent value="tab3">
              <div className="p-4 bg-yellow-50 rounded">
                Conteúdo da Tab 3 - Refs seguros com timeout
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleStressTest} className="mr-4">
            🚀 Teste de Stress DOM ({testCount})
          </Button>
          <div className="text-sm text-gray-600 mt-2">
            ✅ Componentes com proteção removeChild/insertBefore
            <br />
            ✅ AnimatePresence controlado manualmente
            <br />
            ✅ Portal refs com verificação de parentNode
          </div>
        </div>
      </CardContent>
    </Card>
  );
}