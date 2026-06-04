// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlayer } from './render-with-player';
import { RepeatButton } from '@/components/player/RepeatButton';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { VolumeControl } from '@/components/player/VolumeControl';

afterEach(cleanup);

describe('RepeatButton', () => {
  it('reflects an inactive state and cycles off → all on click', () => {
    const setRepeat = vi.fn();
    renderWithPlayer(<RepeatButton />, { player: { repeat: 'off', setRepeat } });
    const btn = screen.getByRole('button');

    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toContain('off');

    fireEvent.click(btn);
    expect(setRepeat).toHaveBeenCalledWith('all');
  });

  it('marks the pressed state and shows the "1" badge for repeat=one', () => {
    renderWithPlayer(<RepeatButton />, { player: { repeat: 'one', setRepeat: vi.fn() } });
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('1')).toBeTruthy();
  });
});

describe('ShuffleButton', () => {
  it('reflects and toggles shuffle state', () => {
    const setShuffle = vi.fn();
    renderWithPlayer(<ShuffleButton />, { player: { shuffle: false, setShuffle } });
    const btn = screen.getByRole('button');

    expect(btn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn);
    expect(setShuffle).toHaveBeenCalledWith(true);
  });

  it('marks pressed when shuffle is on', () => {
    renderWithPlayer(<ShuffleButton />, { player: { shuffle: true, setShuffle: vi.fn() } });
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('VolumeControl', () => {
  it('labels the mute button by state and mutes on click', () => {
    const setVolume = vi.fn();
    renderWithPlayer(<VolumeControl />, { player: { volume: 0.5, setVolume } });
    const mute = screen.getByRole('button');

    expect(mute.getAttribute('aria-label')).toBe('Mute');
    expect(screen.getByRole('slider').getAttribute('aria-label')).toBe('Volume');

    fireEvent.click(mute);
    expect(setVolume).toHaveBeenCalledWith(0);
  });

  it('updates volume from the slider', () => {
    const setVolume = vi.fn();
    renderWithPlayer(<VolumeControl />, { player: { volume: 0.5, setVolume } });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.25' } });
    expect(setVolume).toHaveBeenCalledWith(0.25);
  });

  it('labels Unmute and restores volume when muted', () => {
    const setVolume = vi.fn();
    renderWithPlayer(<VolumeControl />, { player: { volume: 0, setVolume } });

    const mute = screen.getByRole('button');
    expect(mute.getAttribute('aria-label')).toBe('Unmute');
    fireEvent.click(mute);
    expect(setVolume).toHaveBeenCalledWith(0.8);
  });
});
