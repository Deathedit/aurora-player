import { Box, Text, chakra } from '@chakra-ui/react';
import { Virtuoso } from 'react-virtuoso';
import { TrackRow } from '@/components/library/TrackRow';
import { ALL_ALBUMS, TRACK_COUNT } from '@/constants/text';
import type { AlbumGroup } from './types';

export function AlbumDetail({
  album,
  scrollParent,
  onBack,
}: {
  album: AlbumGroup;
  scrollParent: HTMLElement;
  onBack: () => void;
}) {
  return (
    <>
      <chakra.button
        type="button"
        onClick={onBack}
        mb="4"
        fontSize="sm"
        color="primary"
        _hover={{ textDecoration: 'underline' }}
      >
        {ALL_ALBUMS}
      </chakra.button>
      <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
        {album.displayName}
      </Text>
      <Text mt="1" fontSize="sm" color="mutedForeground">
        {TRACK_COUNT(album.tracks.length)}
      </Text>
      <Box mt="4">
        <Virtuoso
          data={album.tracks}
          itemContent={(i, track) => <TrackRow track={track} index={i} />}
          fixedItemHeight={56}
          customScrollParent={scrollParent}
        />
      </Box>
    </>
  );
}
