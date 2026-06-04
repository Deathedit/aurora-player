// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { Scrubber } from '@/components/player/Scrubber';

afterEach(cleanup);

describe('Scrubber', () => {
  it('exposes slider semantics derived from progress', () => {
    renderWithPlayer(<Scrubber />, { progress: { currentTime: 30, duration: 100 } });
    const slider = screen.getByRole('slider');

    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
    expect(slider.getAttribute('aria-valuenow')).toBe('30');
    expect(slider.getAttribute('aria-valuetext')).toBe('0:30');
    expect(slider.getAttribute('tabindex')).toBe('0');
    expect(slider.getAttribute('aria-label')).toBeTruthy();
  });

  it('seeks with arrow, Home and End keys', () => {
    const seek = vi.fn();
    renderWithPlayer(<Scrubber />, { player: { seek }, progress: { currentTime: 30, duration: 100 } });
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(seek).toHaveBeenLastCalledWith(35);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(seek).toHaveBeenLastCalledWith(25);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(seek).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(seek).toHaveBeenLastCalledWith(100);
  });

  it('clamps seeking to the track bounds', () => {
    const seek = vi.fn();
    renderWithPlayer(<Scrubber />, { player: { seek }, progress: { currentTime: 1, duration: 100 } });
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowLeft' });
    expect(seek).toHaveBeenLastCalledWith(0);
  });

  it('ignores keys when there is no duration', () => {
    const seek = vi.fn();
    renderWithPlayer(<Scrubber />, { player: { seek }, progress: { currentTime: 0, duration: 0 } });
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(seek).not.toHaveBeenCalled();
  });

  it('ignores keys that are not seek controls', () => {
    const seek = vi.fn();
    renderWithPlayer(<Scrubber />, { player: { seek }, progress: { currentTime: 30, duration: 100 } });
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Tab' });
    expect(seek).not.toHaveBeenCalled();
  });

  it('seeks to the clicked position', () => {
    const seek = vi.fn();
    renderWithPlayer(<Scrubber />, { player: { seek }, progress: { currentTime: 30, duration: 100 } });
    fireEvent.click(screen.getByRole('slider'), { clientX: 10 });
    expect(seek).toHaveBeenCalled();
  });
});
