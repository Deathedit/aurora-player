import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { X, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { Scrubber } from '@/components/player/Scrubber';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { RepeatButton } from '@/components/player/RepeatButton';
import { VolumeControl } from '@/components/player/VolumeControl';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';
import { useEffect, useRef } from 'react';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isPlaying, toggle, next, prev } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useCurrentTrack();
  const volumeRowRef = useRef<HTMLDivElement>(null);
  useVolumeWheel(volumeRowRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !current) return null;

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

      <Flex w="full" maxW={{ base: 'md', md: 'lg' }} flexDir="column" alignItems="center" gap="6">
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
          <Scrubber w="full" />
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
          <ShuffleButton iconSize={20} p="2" />
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
            {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }} />}
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
          <RepeatButton iconSize={20} p="2" badgeRight="0.5" />
        </Flex>

        <Flex ref={volumeRowRef} w="full" maxW={{ base: 'sm', md: 'xs' }} alignItems="center" gap="3">
          <VolumeControl sliderProps={{ flex: '1' }} />
        </Flex>
      </Flex>
    </Box>
  );
}
