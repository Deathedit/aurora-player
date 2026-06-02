import { usePlayer, usePlayerProgress } from '@/player-context';
import { formatTime } from '@/text';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronUp, Maximize2 } from 'lucide-react';
import { VolumeIcon } from '@/components/ui/volume-icon';
import { useEffect, useMemo, useRef } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

export function TransportBar({
  onNowPlaying,
  nowPlayingOpen,
}: {
  onNowPlaying?: () => void;
  nowPlayingOpen?: boolean;
}) {
  const {
    currentId,
    library,
    isPlaying,
    toggle,
    next,
    prev,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
    volume,
    setVolume,
    seek,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useMemo(() => library.find((t) => t.id === currentId) ?? null, [library, currentId]);
  const isDesktop = useIsDesktop();
  const showArt = isDesktop || !nowPlayingOpen;
  const footerRef = useRef<HTMLElement>(null);
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  });

  useEffect(() => {
    if (!isDesktop) return;
    const el = footerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const v = volumeRef.current;
      setVolume(Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setVolume, isDesktop]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      as="footer"
      ref={footerRef as React.Ref<HTMLDivElement>}
      layerStyle="glass"
      position="fixed"
      insetX={0}
      bottom={{ base: '14', md: '0' }}
      zIndex={40}
      display="flex"
      alignItems="center"
      borderTopWidth="1px"
      px="3"
      h={{ base: '20', md: '16' }}
    >
      <chakra.button
        type="button"
        onClick={onNowPlaying}
        display="flex"
        minW={0}
        flex="1"
        alignItems="center"
        gap="3"
        cursor={{ base: 'pointer', md: 'default' }}
      >
        {showArt && current?.artUrl ? (
          <chakra.img src={current.artUrl} alt="" boxSize="11" flexShrink={0} rounded="md" objectFit="cover" />
        ) : (
          <Box boxSize="11" flexShrink={0} rounded="md" bg="muted" />
        )}
        <Box minW={0}>
          <Text truncate fontSize="sm" fontWeight="medium">
            {current?.title ?? '—'}
          </Text>
          <Text truncate fontSize="xs" color="mutedForeground">
            {current?.artist ?? '—'}
          </Text>
        </Box>
        <Box color="mutedForeground" display={{ base: 'block', md: 'none' }} flexShrink={0}>
          <ChevronUp size={16} />
        </Box>
      </chakra.button>

      <Flex flexShrink={0} alignItems="center" gap={{ base: '1', md: '1.5' }}>
        <chakra.button
          type="button"
          onClick={() => setShuffle(!shuffle)}
          display={{ base: 'none', md: 'inline-flex' }}
          rounded="full"
          p="1.5"
          color={shuffle ? 'primary' : 'mutedForeground'}
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <Shuffle size={14} />
        </chakra.button>
        <chakra.button
          type="button"
          onClick={prev}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <SkipBack size={16} />
        </chakra.button>
        <chakra.button
          type="button"
          onClick={toggle}
          layerStyle="accentGradient"
          display="flex"
          boxSize={{ base: '10', md: '9' }}
          alignItems="center"
          justifyContent="center"
          rounded="full"
          color="primaryForeground"
          transition="transform 0.15s"
          _active={{ transform: 'scale(0.95)' }}
        >
          {isPlaying ? (
            <Pause size={isDesktop ? 16 : 20} />
          ) : (
            <Play size={isDesktop ? 16 : 20} style={{ marginLeft: '2px' }} />
          )}
        </chakra.button>
        <chakra.button
          type="button"
          onClick={next}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <SkipForward size={16} />
        </chakra.button>
        <chakra.button
          type="button"
          onClick={() => {
            const modes = ['off', 'all', 'one'] as const;
            const idx = modes.indexOf(repeat);
            setRepeat(modes[(idx + 1) % 3]);
          }}
          display={{ base: 'none', md: 'inline-flex' }}
          position="relative"
          rounded="full"
          p="1.5"
          color={repeat !== 'off' ? 'primary' : 'mutedForeground'}
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <Repeat size={14} />
          {repeat === 'one' && (
            <Text position="absolute" top="-0.5" right="0" fontSize="0.5rem" fontWeight="bold">
              1
            </Text>
          )}
        </chakra.button>
      </Flex>

      <Flex display={{ base: 'none', md: 'flex' }} flex="1" minW={0} alignItems="center" gap="3">
        <Text flexShrink={0} fontSize="xs" color="mutedForeground" css={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)}
        </Text>
        <Box
          position="relative"
          display="flex"
          flex="1"
          h="5"
          cursor="pointer"
          alignItems="center"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seek((x / rect.width) * duration);
          }}
          css={{ '&:hover .transport-track': { height: '6px' } }}
        >
          <Box
            className="transport-track"
            h="1"
            w="full"
            rounded="full"
            bg="muted"
            transition="height 0.15s"
            overflow="hidden"
          >
            <Box h="full" rounded="full" layerStyle="accentGradient" style={{ width: `${pct}%` }} />
          </Box>
        </Box>
        <Text flexShrink={0} fontSize="xs" color="mutedForeground" css={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(duration)}
        </Text>
        <chakra.button
          type="button"
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          display="flex"
          boxSize="5"
          alignItems="center"
          justifyContent="center"
          color="mutedForeground"
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <VolumeIcon volume={volume} style={{ width: 16, height: 16 }} />
        </chakra.button>
        <chakra.input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))}
          w="20"
          accentColor="var(--chakra-colors-primary)"
        />
        <Text
          w="9"
          flexShrink={0}
          textAlign="right"
          fontSize="xs"
          color="mutedForeground"
          css={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(volume * 100)}%
        </Text>
        <chakra.button
          type="button"
          onClick={onNowPlaying}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors 0.15s"
          _hover={{ color: 'foreground' }}
        >
          <Maximize2 size={14} />
        </chakra.button>
      </Flex>
    </Box>
  );
}
