import { usePlayer } from '@/player-context';
import { TrackRow } from '@/components/library/TrackRow';
import { EMPTY_LIBRARY } from '@/text';
import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Box, Container, Text } from '@chakra-ui/react';

export function Library({ scrollParent }: { scrollParent: HTMLElement }) {
  const { library } = usePlayer();

  const sorted = useMemo(
    () =>
      [...library].sort(
        (a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.title.localeCompare(b.title),
      ),
    [library],
  );

  if (library.length === 0) {
    return (
      <Container maxW="6xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6">
        <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
          Library
        </Text>
        <Text mt="8" color="mutedForeground">
          {EMPTY_LIBRARY}
        </Text>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6" pb="4">
      <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
        Library
      </Text>
      <Text mt="2" fontSize="sm" color="mutedForeground">
        {library.length} tracks
      </Text>
      <Box mt="4">
        <Virtuoso
          data={sorted}
          itemContent={(i, track) => <TrackRow track={track} index={i} />}
          fixedItemHeight={56}
          customScrollParent={scrollParent}
        />
      </Box>
    </Container>
  );
}
