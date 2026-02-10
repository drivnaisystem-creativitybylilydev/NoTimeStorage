'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AppModal } from './AppModal';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type AlertOptions = {
  title: string;
  message: string;
  buttonLabel?: string;
};

type AppModalContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
};

const AppModalContext = createContext<AppModalContextValue | null>(null);

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<'confirm' | 'alert'>('alert');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirmLabel, setConfirmLabel] = useState('Confirm');
  const [cancelLabel, setCancelLabel] = useState('Cancel');
  const [buttonLabel, setButtonLabel] = useState('OK');
  const [destructive, setDestructive] = useState(false);

  const resolveRef = useRef<(value?: boolean) => void>(() => {});

  const close = useCallback(() => setOpen(false), []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = (v) => resolve(v ?? false);
      setTitle(options.title);
      setMessage(options.message);
      setConfirmLabel(options.confirmLabel ?? 'Confirm');
      setCancelLabel(options.cancelLabel ?? 'Cancel');
      setDestructive(options.destructive ?? false);
      setVariant('confirm');
      setOpen(true);
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setTitle(options.title);
      setMessage(options.message);
      setButtonLabel(options.buttonLabel ?? 'OK');
      setVariant('alert');
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current(true);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current(false);
  }, []);

  return (
    <AppModalContext.Provider value={{ confirm, alert }}>
      {children}
      <AppModal
        open={open}
        onClose={close}
        title={title}
        message={message}
        variant={variant}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        buttonLabel={buttonLabel}
        destructive={destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AppModalContext.Provider>
  );
}

export function useAppModal(): AppModalContextValue {
  const ctx = useContext(AppModalContext);
  if (!ctx) {
    throw new Error('useAppModal must be used within AppModalProvider');
  }
  return ctx;
}
