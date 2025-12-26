'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons: Record<AlertType, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

const styles: Record<AlertType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const iconStyles: Record<AlertType, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  action,
  className,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={cn('rounded-lg border p-4', styles[type], className)}>
      <div className="flex">
        <div className={cn('flex-shrink-0', iconStyles[type])}>
          {icon || icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={cn(
                  'text-sm font-medium underline hover:no-underline',
                  iconStyles[type]
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Disclaimer component - специально для психологических предупреждений
interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <Alert type="info" className={cn('text-sm', className)}>
      <p className="font-medium mb-2">Важная информация</p>
      <p className="mb-2">
        Результаты онлайн-тестирования носят информационный характер и не являются
        клиническим диагнозом. Они не заменяют консультацию квалифицированного специалиста.
      </p>
      <p>
        При наличии серьёзных проблем рекомендуем обратиться к психологу для
        получения профессиональной помощи.
      </p>
    </Alert>
  );
}

// Crisis warning component
interface CrisisWarningProps {
  onContactCrisis?: () => void;
  className?: string;
}

export function CrisisWarning({ onContactCrisis, className }: CrisisWarningProps) {
  return (
    <Alert
      type="error"
      title="Требуется помощь специалиста"
      action={onContactCrisis ? { label: 'Связаться с психологом', onClick: onContactCrisis } : undefined}
      className={className}
    >
      <p className="mb-2">
        По результатам тестирования рекомендуется консультация специалиста.
        Это не означает наличие серьёзных проблем, но профессиональная оценка поможет
        лучше понять ситуацию.
      </p>
      <div className="mt-3 p-3 bg-red-100 rounded-md">
        <p className="font-medium text-red-900 mb-1">Кризисная линия помощи:</p>
        <p className="text-red-800">
          <a href="tel:150" className="font-bold hover:underline">150</a> — бесплатная линия доверия для детей и подростков
        </p>
        <p className="text-red-800">
          <a href="tel:111" className="font-bold hover:underline">111</a> — телефон доверия
        </p>
      </div>
    </Alert>
  );
}
