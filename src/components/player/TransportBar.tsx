import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Maximize2 } from 'lucide-react';
import { Scrubber } from '@/components/player/Scrubber';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { RepeatButton } from '@/components/player/RepeatButton';
import { VolumeControl } from '@/components/player/VolumeControl';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useRef } from 'react';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

const CPlay = chakra(Play);
const CPause = chakra(Pause);

export function TransportBar({
  onNowPlaying,
  nowPlayingOpen,
}: {
  onNowPlaying?: () => void;
  nowPlayingOpen?: boolean;
}) {
  const { isPlaying, toggle, next, prev } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useCurrentTrack();
  const isDesktop = useIsDesktop();
  const showArt = isDesktop || !nowPlayingOpen;
  const footerRef = useRef<HTMLElement>(null);
  useVolumeWheel(footerRef);

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
        <ShuffleButton iconSize={14} display={{ base: 'none', md: 'inline-flex' }} p="1.5" />
        <chakra.button
          type="button"
          onClick={prev}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors"
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
          {isPlaying ? <CPause boxSize={{ base: 5, md: 4 }} /> : <CPlay boxSize={{ base: 5, md: 4 }} ml="0.5" />}
        </chakra.button>
        <chakra.button
          type="button"
          onClick={next}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors"
          _hover={{ color: 'foreground' }}
        >
          <SkipForward size={16} />
        </chakra.button>
        <RepeatButton iconSize={14} display={{ base: 'none', md: 'inline-flex' }} p="1.5" />
      </Flex>

      <Flex display={{ base: 'none', md: 'flex' }} flex="1" minW={0} alignItems="center" gap="3">
        <Text flexShrink={0} fontSize="xs" color="mutedForeground" css={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)}
        </Text>
        <Scrubber flex="1" />
        <Text flexShrink={0} fontSize="xs" color="mutedForeground" css={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(duration)}
        </Text>
        <VolumeControl sliderProps={{ w: '20' }} />
        <chakra.button
          type="button"
          onClick={onNowPlaying}
          rounded="full"
          p="1.5"
          color="mutedForeground"
          transition="colors"
          _hover={{ color: 'foreground' }}
        >
          <Maximize2 size={14} />
        </chakra.button>
      </Flex>
    </Box>
  );
}
