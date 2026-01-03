'use client';

import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'illustration';
}

// Default icons for common empty states
const defaultIcons = {
  noData: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  noResults: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  noTests: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  noChildren: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  noConsultations: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  error: (
    <svg className="w-16 h-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const variants = {
    default: 'py-12',
    compact: 'py-6',
    illustration: 'py-16',
  };

  return (
    <div className={cn('text-center', variants[variant], className)}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function EmptyStateNoResults({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.noResults}
      title="Ничего не найдено"
      description="Попробуйте изменить параметры поиска или фильтры"
      action={onReset ? { label: 'Сбросить фильтры', onClick: onReset } : undefined}
    />
  );
}

export function EmptyStateNoTests({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.noTests}
      title="Нет пройденных тестов"
      description="Пройдите свой первый психологический тест, чтобы получить персонализированные рекомендации"
      action={{ label: 'Выбрать тест', onClick: onBrowse }}
    />
  );
}

export function EmptyStateNoChildren({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.noChildren}
      title="Нет добавленных детей"
      description="Добавьте профиль ребёнка, чтобы начать тестирование и отслеживать результаты"
      action={{ label: 'Добавить ребёнка', onClick: onAdd }}
    />
  );
}

export function EmptyStateNoConsultations({ onBook }: { onBook: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.noConsultations}
      title="Нет записей на консультации"
      description="Запишитесь на консультацию к психологу для получения профессиональной помощи"
      action={{ label: 'Записаться', onClick: onBook }}
    />
  );
}

export function EmptyStateError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.error}
      title="Произошла ошибка"
      description="Не удалось загрузить данные. Пожалуйста, попробуйте ещё раз"
      action={{ label: 'Повторить', onClick: onRetry }}
    />
  );
}
