import { describe, it, expect } from 'vitest';
import { hashCode, stableId } from '../hashCode';

describe('hashCode', () => {
  it('должен возвращать детерминированный хеш для одной и той же строки', () => {
    const str = 'test-string';
    const hash1 = hashCode(str);
    const hash2 = hashCode(str);
    expect(hash1).toBe(hash2);
  });

  it('должен возвращать разные хеши для разных строк', () => {
    const hash1 = hashCode('string1');
    const hash2 = hashCode('string2');
    expect(hash1).not.toBe(hash2);
  });

  it('должен возвращать положительное число', () => {
    const hash = hashCode('any-string');
    expect(hash).toBeGreaterThanOrEqual(0);
  });

  it('должен возвращать число меньше 10000', () => {
    const hash = hashCode('any-string');
    expect(hash).toBeLessThan(10000);
  });

  it('должен обрабатывать пустую строку', () => {
    const hash = hashCode('');
    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThanOrEqual(0);
  });
});

describe('stableId', () => {
  it('должен генерировать стабильный ID на основе префикса и частей', () => {
    const id1 = stableId('post', 'part1', 'part2');
    const id2 = stableId('post', 'part1', 'part2');
    expect(id1).toBe(id2);
  });

  it('должен генерировать разные ID для разных частей', () => {
    const id1 = stableId('post', 'part1', 'part2');
    const id2 = stableId('post', 'part1', 'part3');
    expect(id1).not.toBe(id2);
  });

  it('должен начинаться с префикса', () => {
    const id = stableId('test', 'data');
    expect(id.startsWith('test_')).toBe(true);
  });
});
