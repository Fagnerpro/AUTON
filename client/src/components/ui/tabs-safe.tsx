"use client"

import * as React from "react"
import ErrorBoundary from "@/components/ErrorBoundary"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./tabs"

// Wrapper seguro para Tabs com ErrorBoundary
interface SafeTabsProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function SafeTabs({ children, fallback, onError, ...props }: SafeTabsProps & React.ComponentProps<typeof Tabs>) {
  const tabsKey = React.useId();
  
  return (
    <ErrorBoundary 
      key={`safe-tabs-${tabsKey}`}
      fallback={fallback || (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-sm text-red-600">
            Erro ao carregar abas. Tente recarregar a página.
          </p>
        </div>
      )}
    >
      <Tabs {...props}>
        {children}
      </Tabs>
    </ErrorBoundary>
  );
}

// Re-exportar componentes com proteção
export {
  TabsContent,
  TabsList,
  TabsTrigger,
};