"use client"

import * as React from "react"
import ErrorBoundary from "@/components/ErrorBoundary"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

// Wrapper seguro para Select com ErrorBoundary
interface SafeSelectProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function SafeSelect({ children, fallback, onError, ...props }: SafeSelectProps & React.ComponentProps<typeof Select>) {
  const selectKey = React.useId();
  
  return (
    <ErrorBoundary 
      key={`safe-select-${selectKey}`}
      fallback={fallback || (
        <div className="p-2 text-sm text-muted-foreground border rounded-md">
          Erro ao carregar seleção
        </div>
      )}
    >
      <Select {...props}>
        {children}
      </Select>
    </ErrorBoundary>
  );
}

// Re-exportar componentes com proteção
export {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};