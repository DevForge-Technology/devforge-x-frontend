'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ richColors, theme, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      richColors={false}
      className="toaster group"
      position="top-right"
      closeButton
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            'group toast max-w-[32rem] rounded-3xl border border-slate-200/90 bg-white text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-xl',
          title: 'font-semibold text-slate-950',
          description: 'text-slate-700',
          actionButton: 'rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground',
          cancelButton: 'text-slate-600',
          closeButton: 'text-slate-500 hover:text-slate-900',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
