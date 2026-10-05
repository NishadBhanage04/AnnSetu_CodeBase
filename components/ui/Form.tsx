import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from "react";

const FIELD_CLASSES =
  "block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none disabled:bg-stone-100";

export function Label({ className = "", ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...rest}
      className={`mb-1 block text-sm font-medium text-stone-800 ${className}`}
    />
  );
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${FIELD_CLASSES} ${className}`} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${FIELD_CLASSES} min-h-[5rem] ${className}`} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`${FIELD_CLASSES} ${className}`} />;
}

export function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-stone-500">{children}</p>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-xs text-red-600">{children}</p>;
}
