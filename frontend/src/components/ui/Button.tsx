import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-gray-900 text-white border-transparent hover:bg-gray-800 focus-visible:ring-gray-900',
  secondary:
    'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus-visible:ring-gray-300',
  subtle:
    'bg-gray-100 text-gray-900 border-transparent hover:bg-gray-200 focus-visible:ring-gray-300',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4',
  lg: 'h-10 px-6 text-base',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
