// @vitest-environment happy-dom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { GlassToggle } from '@/components/settings/GlassToggle';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('no-glass');
});

describe('GlassToggle', () => {
  it('is a switch that toggles aria-checked, the no-glass class, and storage', () => {
    renderWithPlayer(<GlassToggle />);
    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.classList.contains('no-glass')).toBe(true);
    expect(localStorage.getItem('aurora-glass')).toBe('false');

    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.classList.contains('no-glass')).toBe(false);
    expect(localStorage.getItem('aurora-glass')).toBe('true');
  });
});
