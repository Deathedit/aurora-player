import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

type AudioContextCtor = typeof AudioContext;

export function useAudioGain(audioRef: RefObject<HTMLAudioElement | null>, volume: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  });

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => {
      if (!ctxRef.current) {
        const Ctx: AudioContextCtor | undefined =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const source = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        gain.gain.value = volumeRef.current;
        source.connect(gain).connect(ctx.destination);
        el.volume = 1;
        ctxRef.current = ctx;
        gainRef.current = gain;
      }
      ctxRef.current?.resume();
    };
    el.addEventListener('play', onPlay);
    return () => el.removeEventListener('play', onPlay);
  }, [audioRef]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
      return;
    }
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume, audioRef]);
}
