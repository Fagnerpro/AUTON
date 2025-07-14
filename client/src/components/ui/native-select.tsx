import React from 'react';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  placeholder?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

interface NativeSelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export const NativeSelectOption = React.forwardRef<HTMLOptionElement, NativeSelectOptionProps>(
  ({ children, ...props }, ref) => {
    return (
      <option ref={ref} {...props}>
        {children}
      </option>
    );
  }
);

NativeSelectOption.displayName = 'NativeSelectOption';