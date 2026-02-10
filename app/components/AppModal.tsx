'use client';

import Image from 'next/image';

export type AppModalVariant = 'confirm' | 'alert';

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant: AppModalVariant;
  /** For confirm: primary action label (e.g. "Cancel booking") */
  confirmLabel?: string;
  /** For confirm: secondary action label (e.g. "Keep booking") */
  cancelLabel?: string;
  /** For alert: single button label */
  buttonLabel?: string;
  /** Style confirm button as destructive (e.g. red) */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export function AppModal({
  open,
  onClose,
  title,
  message,
  variant,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  buttonLabel = 'OK',
  destructive,
  onConfirm,
  onCancel,
}: AppModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
      aria-describedby="app-modal-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(75, 46, 37, 0.35)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (variant === 'alert') handleConfirm();
          else handleCancel();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-paper)',
          borderRadius: '16px',
          border: '2px solid var(--color-latte)',
          boxShadow: '0 24px 48px rgba(75, 46, 37, 0.2)',
          padding: '32px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <Image
            src="/brand/notime-storage-logo.png"
            alt=""
            width={56}
            height={56}
            style={{ display: 'block', margin: '0 auto 16px' }}
          />
          <h2
            id="app-modal-title"
            style={{
              fontSize: '1.375rem',
              fontWeight: '700',
              color: 'var(--color-coffee)',
              marginBottom: '8px',
            }}
          >
            {title}
          </h2>
          <p
            id="app-modal-desc"
            style={{
              fontSize: '1rem',
              color: 'var(--color-gray-600)',
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: variant === 'alert' ? 'center' : 'stretch',
            flexWrap: 'wrap',
          }}
        >
          {variant === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="button-secondary"
                style={{ flex: 1, padding: '12px 20px', fontSize: '1rem' }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  ...(destructive
                    ? {
                        background: '#b91c1c',
                        color: '#fff',
                      }
                    : {
                        background: 'var(--color-coffee)',
                        color: 'var(--color-white)',
                      }),
                }}
                onMouseOver={(e) => {
                  if (destructive) {
                    e.currentTarget.style.background = '#991b1b';
                  } else {
                    e.currentTarget.style.background = 'var(--color-coffee-dark)';
                  }
                }}
                onMouseOut={(e) => {
                  if (destructive) {
                    e.currentTarget.style.background = '#b91c1c';
                  } else {
                    e.currentTarget.style.background = 'var(--color-coffee)';
                  }
                }}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="button-primary"
              style={{ padding: '12px 32px', fontSize: '1rem' }}
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
