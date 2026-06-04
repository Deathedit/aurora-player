// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useLocalStorage', () => {
  it('reads an existing value from the prefixed key', () => {
    localStorage.setItem('aurora-volume', JSON.stringify(0.3));
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.3);
  });

  it('falls back to the initial value when the key is missing', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.8);
  });

  it('falls back to the initial value when the stored JSON is corrupt', () => {
    localStorage.setItem('aurora-volume', '{not json');
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.8);
  });

  it('persists updates back to the prefixed key', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    act(() => result.current[1](0.5));
    expect(result.current[0]).toBe(0.5);
    expect(JSON.parse(localStorage.getItem('aurora-volume')!)).toBe(0.5);
  });
});
