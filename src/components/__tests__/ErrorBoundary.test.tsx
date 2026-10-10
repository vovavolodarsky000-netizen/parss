import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Компонент, который вызывает ошибку
const ProblemChild = () => {
  throw new Error('Тестовая ошибка');
};

const GoodChild = () => <div>Всё хорошо</div>;

describe('ErrorBoundary', () => {
  it('должен отображать дочерние компоненты при отсутствии ошибок', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Всё хорошо')).toBeInTheDocument();
  });

  it('должен перехватывать ошибки и отображать fallback UI', () => {
    // Подавляем ошибки консоли для теста
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
    expect(screen.getByText('Обновить страницу')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('должен вызывать onError callback при ошибке', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('должен использовать кастомный fallback если он предоставлен', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const customFallback = <div>Кастомная ошибка</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Кастомная ошибка')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('должен сбрасывать состояние при клике на кнопку "Попробовать снова"', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = true;
    const ConditionalChild = () => {
      if (shouldThrow) {
        throw new Error('Тестовая ошибка');
      }
      return <div>Восстановлено</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();

    // Меняем условие и нажимаем "Попробовать снова"
    shouldThrow = false;
    fireEvent.click(screen.getByText('Попробовать снова'));

    rerender(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Восстановлено')).toBeInTheDocument();

    spy.mockRestore();
  });
});
