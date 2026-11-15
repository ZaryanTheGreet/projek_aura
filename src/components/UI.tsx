import React, { useRef } from 'react';
import { ZoneType } from '../types';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  icon?: string;
  debounceMs?: number;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  onClick,
  debounceMs = 300,
  className = '',
  disabled,
  ...props
}) => {
  const lastClickRef = useRef<number>(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastClickRef.current < debounceMs) {
      e.preventDefault();
      return;
    }
    lastClickRef.current = now;
    if (onClick) onClick(e);
  };

  const variantClass =
    variant === 'primary'
      ? 'aura-btn-primary'
      : variant === 'secondary'
      ? 'aura-btn-secondary'
      : variant === 'text'
      ? 'aura-btn-text'
      : 'aura-btn-secondary'; // for danger, we use neutral borders without alarming red buttons per design rules

  return (
    <button
      className={`aura-btn ${variantClass} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <i className={`fa-solid ${icon}`} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
};

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`aura-card ${className}`} {...props}>
      {children}
    </div>
  );
};

// Zone Pill Component
interface ZonePillProps {
  zone: ZoneType;
  label?: string;
  className?: string;
}

export const ZonePill: React.FC<ZonePillProps> = ({ zone, label, className = '' }) => {
  const defaultLabels: Record<ZoneType, string> = {
    calm: 'Tenang',
    watch: 'Waspada',
    heavy: 'Butuh istirahat',
  };

  const displayLabel = label || defaultLabels[zone];

  return (
    <span className={`aura-zone-pill ${zone} ${className}`}>
      <span className={`aura-zone-dot ${zone}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
};

// Chip Component
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`aura-chip ${active ? 'active' : ''} ${className}`}
      aria-pressed={active}
      {...props}
    >
      {icon && <i className={`fa-solid ${icon}`} style={{ marginRight: 6 }} aria-hidden="true" />}
      {children}
    </button>
  );
};

// Skeleton Component
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = 8,
  className = '',
}) => {
  return (
    <div
      className={`aura-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
};

// Bottom Sheet / Modal Overlay
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="aura-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="aura-sheet">
        <div className="aura-sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {title ? <h2 className="text-h2">{title}</h2> : <div />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 8,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// Banner Component
interface BannerProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({ children, onClose, className = '' }) => {
  return (
    <div
      className={`aura-card ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        fontSize: 14,
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            padding: 4,
            fontSize: 14,
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
};

// PasswordField Component (Issue 6)
interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  value,
  onChange,
  className = '',
  placeholder = '••••••••',
  required,
  autoComplete = 'current-password',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const toggleVisibility = () => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      setShowPassword((prev) => !prev);
      // Restore focus and cursor positions on next microtask
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (start !== null && end !== null) {
            inputRef.current.setSelectionRange(start, end);
          }
        }
      }, 0);
    } else {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`aura-input ${className}`}
        style={{ paddingRight: 48 }}
        {...props}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={showPassword}
        style={{
          position: 'absolute',
          right: 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 44,
          height: 44,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--ink-muted)',
          cursor: 'pointer',
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        <i
          className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};// Aura Logo Component (Issue 7)
interface AuraLogoProps {
  badge?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({
  badge,
  size = 'md',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;

  return (
    <div
      className={`aura-logo-brand ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle cx="16" cy="16" r="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="12" cy="14" r="1.8" fill="var(--ink)" />
        <circle cx="20" cy="14" r="1.8" fill="var(--ink)" />
        <path
          d="M 13 20 Q 16 22 19 20"
          stroke="var(--ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        Aura
      </span>
      {badge && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid var(--ink)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: 0.5,
            lineHeight: 1.2,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
