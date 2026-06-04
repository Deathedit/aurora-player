import { vi } from 'vitest';

export interface MockAudio {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  volume: number;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
  emit: (type: string) => void;
}

export function createMockAudio(): MockAudio {
  const listeners = new Map<string, Set<() => void>>();
  const emit = (type: string) => {
    listeners.get(type)?.forEach((cb) => cb());
  };

  const audio: MockAudio = {
    src: '',
    currentTime: 0,
    duration: 0,
    paused: true,
    volume: 1,
    play: vi.fn(() => {
      audio.paused = false;
      emit('play');
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      audio.paused = true;
      emit('pause');
    }),
    addEventListener: (type, cb) => {
      let set = listeners.get(type);
      if (!set) listeners.set(type, (set = new Set()));
      set.add(cb);
    },
    removeEventListener: (type, cb) => {
      listeners.get(type)?.delete(cb);
    },
    emit,
  };

  return audio;
}
