import { usePlayer } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { Play, Pause } from 'lucide-react';
import type { Track } from '@/types';
import { Box, Flex, Text } from '@chakra-ui/react';
import { memo, useCallback } from 'react';
import { Artwork } from '@/components/ui/Artwork';

const rowHoverCss = {
  '&:hover .track-show': { display: 'block' },
  '&:hover .track-hide': { display: 'none' },
} as const;

const tabularNumsCss = { fontVariantNumeric: 'tabular-nums' } as const;

function Equalizer() {
  return (
    <Flex h="4" alignItems="flex-end" gap="0.5">
      <Box
        className="equalizer-bar"
        w="3px"
        rounded="full"
        bg="primary"
        css={{ animation: 'equalizer1 0.8s ease-in-out infinite' }}
      />
      <Box
        className="equalizer-bar"
        w="3px"
        rounded="full"
        bg="primary"
        css={{ animation: 'equalizer2 0.8s ease-in-out infinite 0.12s' }}
      />
      <Box
        className="equalizer-bar"
        w="3px"
        rounded="full"
        bg="primary"
        css={{ animation: 'equalizer3 0.8s ease-in-out infinite 0.24s' }}
      />
    </Flex>
  );
}

function TrackRowImpl({ track, index }: { track: Track; index: number }) {
  const { currentId, isPlaying, play, toggle } = usePlayer();
  const active = track.id === currentId;

  const activate = useCallback(() => {
    if (track.id === currentId) toggle();
    else play(track.id);
  }, [track.id, currentId, toggle, play]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      activate();
    },
    [activate],
  );

  return (
    <Flex
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={onKeyDown}
      w="full"
      cursor="pointer"
      alignItems="center"
      gap="3"
      rounded="lg"
      px="3"
      py="2"
      transition="colors"
      _hover={{ bg: 'muted' }}
      bg={active ? 'primaryTint' : undefined}
      borderLeftWidth={active ? '2px' : undefined}
      borderLeftColor={active ? 'primary' : undefined}
      style={{ height: 56 }}
      css={rowHoverCss}
    >
      <Flex w="8" flexShrink={0} justifyContent="center" fontSize="sm" color="mutedForeground">
        {active && isPlaying ? (
          <Equalizer />
        ) : active ? (
          <Pause size={16} color="var(--chakra-colors-primary)" />
        ) : (
          <>
            <Box className="track-hide">{index + 1}</Box>
            <Box className="track-show" display="none">
              <Play size={16} />
            </Box>
          </>
        )}
      </Flex>

      <Artwork src={track.artUrl} boxSize="10" flexShrink={0} rounded="sm" />

      <Box minW={0} flex="1">
        <Text truncate fontSize="sm" color={active ? 'primary' : undefined}>
          {track.title}
        </Text>
        <Text truncate fontSize="xs" color="mutedForeground">
          {track.artist}
        </Text>
      </Box>

      <Text fontSize="xs" color="mutedForeground" css={tabularNumsCss}>
        {formatTime(track.durationSec)}
      </Text>
    </Flex>
  );
}

export const TrackRow = memo(TrackRowImpl);
