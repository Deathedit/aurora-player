import { usePlayer, usePlayerProgress } from '@/player-context';
import { formatTime } from '@/text';
import {
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { VolumeIcon } from '@/components/ui/volume-icon';
import { useEffect, useMemo, useRef } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

export function NowPlaying({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    library,
    currentId,
    isPlaying,
    toggle,
    next,
    prev,
    seek,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    volume,
    setVolume,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useMemo(
    () => library.find((t) => t.id === currentId) ?? null,
    [library, currentId],
  );
  const isDesktop = useIsDesktop();
  const volumeRowRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!isDesktop) return;
    const el = volumeRowRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const v = volumeRef.current;
      setVolume(Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setVolume, open, isDesktop]);

  if (!open || !current) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      layerStyle="glassElevated"
      position="fixed"
      inset={0}
      zIndex={50}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      gap="6"
      p={{ base: '6', md: '10' }}
      css={{
        '--player-glow': `radial-gradient(at 50% 0%, ${current.artColor ?? '#8B5CF6'} 22%, transparent)`,
      }}
    >
      <chakra.button
        type="button"
        onClick={onClose}
        position="absolute"
        right="4"
        top="4"
        color="mutedForeground"
        _hover={{ color: 'foreground' }}
      >
        <X size={24} />
      </chakra.button>

      <Flex
        w="full"
        maxW={{ base: 'md', md: 'lg' }}
        flexDir="column"
        alignItems="center"
        gap="6"
      >
        <Box position="relative" w="full" maxW={{ base: 'sm', md: 'md' }}>
          {current.artUrl ? (
            <chakra.img
              src={current.artUrl}
              alt=""
              aspectRatio="1"
              w="full"
              rounded="xl"
              objectFit="cover"
              shadow="2xl"
            />
          ) : (
            <Box aspectRatio="1" w="full" rounded="xl" bg="muted" />
          )}
          <Box
            pointerEvents="none"
            position="absolute"
            inset={0}
            rounded="xl"
            css={{
              background: 'var(--player-glow)',
              opacity: 0.15,
            }}
          />
        </Box>

        <Box w="full" textAlign="center">
          <Text fontSize="lg" fontWeight="semibold">
            {current.title}
          </Text>
          <Text fontSize="sm" color="mutedForeground">
            {current.artist}
          </Text>
        </Box>

        <Box w="full">
          <Box
            position="relative"
            display="flex"
            h="5"
            cursor="pointer"
            alignItems="center"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              seek((x / rect.width) * duration);
            }}
            css={{ '&:hover .np-track': { height: '6px' } }}
          >
            <Box
              className="np-track"
              h="1"
              w="full"
              rounded="full"
              bg="muted"
              transition="height 0.15s"
              overflow="hidden"
            >
              <Box
                h="full"
                rounded="full"
                layerStyle="accentGradient"
                style={{ width: `${pct}%` }}
              />
            </Box>
          </Box>
          <Flex
            mt="1"
            justifyContent="space-between"
            fontSize="xs"
            color="mutedForeground"
            css={{ fontVariantNumeric: 'tabular-nums' }}
          >
            <Text>{formatTime(currentTime)}</Text>
            <Text>{formatTime(duration)}</Text>
          </Flex>
        </Box>

        <Flex w="full" alignItems="center" justifyContent="space-between">
          <chakra.button
            type="button"
            onClick={() => setShuffle(!shuffle)}
            rounded="full"
            p="2"
            transition="colors 0.15s"
            color={shuffle ? 'primary' : 'mutedForeground'}
            _hover={{ color: 'foreground' }}
          >
            <Shuffle size={20} />
          </chakra.button>
          <chakra.button
            type="button"
            onClick={prev}
            rounded="full"
            p="2"
            color="foreground"
            _hover={{ color: 'primary' }}
          >
            <SkipBack size={24} />
          </chakra.button>
          <chakra.button
            type="button"
            onClick={toggle}
            layerStyle="accentGradient"
            display="flex"
            boxSize="14"
            alignItems="center"
            justifyContent="center"
            rounded="full"
            color="primaryForeground"
            _active={{ transform: 'scale(0.95)' }}
          >
            {isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} style={{ marginLeft: '2px' }} />
            )}
          </chakra.button>
          <chakra.button
            type="button"
            onClick={next}
            rounded="full"
            p="2"
            color="foreground"
            _hover={{ color: 'primary' }}
          >
            <SkipForward size={24} />
          </chakra.button>
          <chakra.button
            type="button"
            onClick={() => {
              const modes = ['off', 'all', 'one'] as const;
              const idx = modes.indexOf(repeat);
              setRepeat(modes[(idx + 1) % 3]);
            }}
            position="relative"
            rounded="full"
            p="2"
            transition="colors 0.15s"
            color={repeat !== 'off' ? 'primary' : 'mutedForeground'}
            _hover={{ color: 'foreground' }}
          >
            <Repeat size={20} />
            {repeat === 'one' && (
              <Text
                position="absolute"
                top="-0.5"
                right="0.5"
                fontSize="0.5rem"
                fontWeight="bold"
              >
                1
              </Text>
            )}
          </chakra.button>
        </Flex>

        <Flex
          ref={volumeRowRef}
          w="full"
          maxW={{ base: 'sm', md: 'xs' }}
          alignItems="center"
          gap="3"
        >
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setVolume(Number(e.target.value))
            }
            flex="1"
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
        </Flex>
      </Flex>
    </Box>
  );
}
