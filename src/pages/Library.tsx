import { usePlayer } from '@/contexts/player-context';
import { useLibrarySource } from '@/contexts/library-source-context';
import { TrackRow } from '@/components/library/TrackRow';
import { SearchDialog } from '@/components/library/SearchDialog';
import { EMPTY_LIBRARY, EMPTY_LIBRARY_SERVER, LIBRARY, TRACK_COUNT } from '@/constants/text';
import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { Track } from '@/types';
import { Box, Text } from '@chakra-ui/react';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeading } from '@/components/ui/PageHeading';

const renderTrack = (i: number, track: Track) => <TrackRow track={track} index={i} />;

export function Library({
  scrollParent,
  nowPlayingOpen = false,
}: {
  scrollParent: HTMLElement;
  nowPlayingOpen?: boolean;
}) {
  const { library } = usePlayer();
  const { mode } = useLibrarySource();

  const sorted = useMemo(
    () =>
      [...library].sort(
        (a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.title.localeCompare(b.title),
      ),
    [library],
  );

  if (library.length === 0) {
    return (
      <PageContainer>
        <PageHeading>{LIBRARY}</PageHeading>
        <Text mt="8" color="mutedForeground">
          {mode === 'backend' ? EMPTY_LIBRARY_SERVER : EMPTY_LIBRARY}
        </Text>
      </PageContainer>
    );
  }

  return (
    <PageContainer pb="4">
      <PageHeading>{LIBRARY}</PageHeading>
      <Text mt="2" fontSize="sm" color="mutedForeground">
        {TRACK_COUNT(sorted.length)}
      </Text>
      <SearchDialog tracks={sorted} nowPlayingOpen={nowPlayingOpen} />
      <Box mt="4">
        <Virtuoso data={sorted} itemContent={renderTrack} fixedItemHeight={56} customScrollParent={scrollParent} />
      </Box>
    </PageContainer>
  );
}
