import { usePlayer } from '@/player-context';
import { formatTime } from '@/text';
import { Play, Pause, Heart } from 'lucide-react';
import type { Track } from '@/types';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

function Equalizer() {
  return (
    <Flex h="4" alignItems="flex-end" gap="0.5">
      <Box w="3px" rounded="full" bg="primary" css={{ animation: 'equalizer1 0.8s ease-in-out infinite' }} />
      <Box w="3px" rounded="full" bg="primary" css={{ animation: 'equalizer2 0.8s ease-in-out infinite 0.12s' }} />
      <Box w="3px" rounded="full" bg="primary" css={{ animation: 'equalizer3 0.8s ease-in-out infinite 0.24s' }} />
    </Flex>
  );
}

export function TrackRow({ track, index }: { track: Track; index: number }) {
  const { currentId, isPlaying, play, toggle } = usePlayer();
  const active = track.id === currentId;

  const activate = () => (active ? toggle() : play(track.id));

  return (
    <Flex
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        activate();
      }}
      w="full"
      cursor="pointer"
      alignItems="center"
      gap="3"
      rounded="lg"
      px="3"
      py="2"
      transition="colors 0.15s"
      _hover={{ bg: 'muted' }}
      bg={active ? 'color-mix(in srgb, var(--chakra-colors-primary) 8%, transparent)' : undefined}
      borderLeftWidth={active ? '2px' : undefined}
      borderLeftColor={active ? 'primary' : undefined}
      style={{ height: 56 }}
      css={{
        '&:hover .track-show': { display: 'block' },
        '&:hover .track-hide': { display: 'none' },
      }}
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

      {track.artUrl ? (
        <chakra.img src={track.artUrl} alt="" boxSize="10" flexShrink={0} rounded="sm" objectFit="cover" />
      ) : (
        <Box boxSize="10" flexShrink={0} rounded="sm" bg="muted" />
      )}

      <Box minW={0} flex="1">
        <Text truncate fontSize="sm" color={active ? 'primary' : undefined}>
          {track.title}
        </Text>
        <Text truncate fontSize="xs" color="mutedForeground">
          {track.artist}
        </Text>
      </Box>

      <chakra.button
        type="button"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        opacity={0}
        transition="opacity 0.15s"
        css={{ 'div:hover > &': { opacity: 1 } }}
      >
        <Heart size={16} color="var(--chakra-colors-mutedForeground)" />
      </chakra.button>

      <Text fontSize="xs" color="mutedForeground" css={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatTime(track.durationSec)}
      </Text>
    </Flex>
  );
}
