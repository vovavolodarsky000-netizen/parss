import { useState, useEffect } from 'react';

/**
 * Хук debounce для оптимизации частых обновлений (PERF-003)
 * Задерживает обновление значения до паузы в вводе
 * 
 * @param value - Значение для debounce
 * @param delay - Задержка в миллисекундах (по умолчанию 300мс)
 * @returns Debounced значение
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * useEffect(() => {
 *   // Этот эффект сработает только через 300мс после последней zmiany
 *   filterData(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
