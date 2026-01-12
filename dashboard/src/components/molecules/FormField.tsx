import { Input, Text } from '../atoms';
import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({
  label,
  error,
  hint,
  required,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <Text variant="body-sm" color="muted">
          {label}
        </Text>
        {required && (
          <span className="text-loss">*</span>
        )}
      </div>
      <Input
        error={error}
        hint={hint}
        {...inputProps}
      />
    </div>
  );
}
