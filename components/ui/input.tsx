import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 aria-invalid:border-brand";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(fieldClasses, "h-10", className)} ref={ref} {...props} />;
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(fieldClasses, "min-h-[96px] py-2.5 leading-relaxed", className)} ref={ref} {...props} />;
  },
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-semibold text-muted", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClasses, "h-10 cursor-pointer font-mono", className)} {...props}>
      {children}
    </select>
  );
}
