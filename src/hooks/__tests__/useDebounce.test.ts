import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('должен возвращать начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('должен задерживать обновление значения', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Изменяем значение
    rerender({ value: 'updated' });

    // Значение ещё не обновилось
    expect(result.current).toBe('initial');

    // Проходим время
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Теперь значение обновилось
    expect(result.current).toBe('updated');
  });

  it('должен использовать задержку по умолчанию 300мс', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Через 299мс ещё не обновилось
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Через 300мс обновилось
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('должен сбрасывать таймер при быстром изменении значения', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Быстро меняем значение несколько раз
    rerender({ value: 'first' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'third' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Ещё не обновилось
    expect(result.current).toBe('initial');

    // Проходим оставшееся время
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Обновилось до последнего значения
    expect(result.current).toBe('third');
  });

  it('должен работать с разными типами данных', () => {
    // Число
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 42 } }
    );

    numberRerender({ value: 100 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(numberResult.current).toBe(100);

    // Объект
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { a: 1, b: 0 } } }
    );

    objectRerender({ value: { a: 0, b: 2 } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(objectResult.current).toEqual({ a: 0, b: 2 });

    // Массив
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: [1, 2, 3] } }
    );

    arrayRerender({ value: [4, 5, 6] });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(arrayResult.current).toEqual([4, 5, 6]);
  });

  it('должен очищать таймер при размонтировании', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Размонтируем до истечения таймера
    unmount();

    // Таймер должен быть очищен (не должно быть ошибок)
    expect(() => {
      vi.advanceTimersByTime(300);
    }).not.toThrow();
  });
});
