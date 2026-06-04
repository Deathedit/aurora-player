import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { SkipBack, SkipForward, ChevronUp, Maximize2 } from 'lucide-react';
import { Scrubber } from '@/components/player/Scrubber';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { RepeatButton } from '@/components/player/RepeatButton';
import { VolumeControl } from '@/components/player/VolumeControl';
import { PlayPauseButton } from '@/components/player/PlayPauseButton';
import { TransportButton } from '@/components/player/TransportButton';
import { Artwork } from '@/components/ui/Artwork';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useRef } from 'react';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';
import { PREVIOUS_TRACK, NEXT_TRACK, OPEN_NOW_PLAYING } from '@/constants/text';

export function TransportBar({
  onNowPlaying,
  nowPlayingOpen,
}: {
  onNowPlaying?: () => void;
  nowPlayingOpen?: boolean;
}) {
  const { next, prev } = usePlayer();
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
        aria-label={OPEN_NOW_PLAYING}
        display="flex"
        minW={0}
        flex="1"
        alignItems="center"
        gap="3"
        cursor={{ base: 'pointer', md: 'default' }}
      >
        <Artwork src={showArt ? current?.artUrl : undefined} boxSize="11" flexShrink={0} rounded="md" />
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
        <TransportButton
          icon={<SkipBack size={16} />}
          onClick={prev}
          aria-label={PREVIOUS_TRACK}
          p="1.5"
          color="mutedForeground"
          transition="colors"
          _hover={{ color: 'foreground' }}
        />
        <PlayPauseButton iconSize={{ base: 5, md: 4 }} boxSize={{ base: '10', md: '9' }} transition="transform 0.15s" />
        <TransportButton
          icon={<SkipForward size={16} />}
          onClick={next}
          aria-label={NEXT_TRACK}
          p="1.5"
          color="mutedForeground"
          transition="colors"
          _hover={{ color: 'foreground' }}
        />
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
        <TransportButton
          icon={<Maximize2 size={14} />}
          onClick={onNowPlaying}
          aria-label={OPEN_NOW_PLAYING}
          p="1.5"
          color="mutedForeground"
          transition="colors"
          _hover={{ color: 'foreground' }}
        />
      </Flex>
    </Box>
  );
}
