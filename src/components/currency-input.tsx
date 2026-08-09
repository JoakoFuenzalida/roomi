"use client";

import { useState, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "defaultValue"> {
  name: string;
  defaultValue?: number | string;
  onValueChange?: (value: number) => void;
}

export function CurrencyInput({
  name,
  defaultValue,
  className,
  placeholder = "$0",
  onValueChange,
  ...props
}: CurrencyInputProps) {
  // Inicializamos el valor numérico crudo
  const [rawValue, setRawValue] = useState<string>(
    defaultValue ? defaultValue.toString() : ""
  );

  // Formateamos el número a CLP (ej: $1.000)
  const formatCurrency = (val: string) => {
    if (!val) return "";
    const num = parseInt(val.replace(/\D/g, ""), 10);
    if (isNaN(num)) return "";
    return "$" + num.toLocaleString("es-CL");
  };

  // Manejador del input de texto
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawValue(raw);
    
    if (onValueChange) {
      onValueChange(raw ? parseInt(raw, 10) : 0);
    }
  };

  return (
    <div className="relative">
      {/* Input oculto que enviará el número limpio al Server Action */}
      <input type="hidden" name={name} value={rawValue} />
      
      {/* Input visible formateado */}
      <input
        type="text"
        inputMode="numeric"
        value={formatCurrency(rawValue)}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(className)}
        {...props}
      />
    </div>
  );
}
