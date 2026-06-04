import { Box, Text, chakra } from '@chakra-ui/react';
import { Artwork } from '@/components/ui/Artwork';
import { TRACK_COUNT } from '@/constants/text';
import { formatTime } from '@/utils/time';
import type { AlbumGroup } from './types';

export function AlbumListRow({ album, onSelect }: { album: AlbumGroup; onSelect: () => void }) {
  return (
    <chakra.button
      type="button"
      onClick={onSelect}
      display="flex"
      w="full"
      alignItems="center"
      gap="3"
      rounded="lg"
      px="3"
      py="2"
      transition="colors"
      _hover={{ bg: 'muted' }}
      style={{ height: 64 }}
    >
      <Artwork src={album.artUrl} boxSize="12" flexShrink={0} rounded="sm" />
      <Box minW={0} flex="1" textAlign="left">
        <Text truncate fontSize="sm" fontWeight="medium">
          {album.displayName}
        </Text>
        <Text fontSize="xs" color="mutedForeground">
          {TRACK_COUNT(album.tracks.length)} &middot; {formatTime(album.tracks.reduce((s, t) => s + t.durationSec, 0))}
        </Text>
      </Box>
    </chakra.button>
  );
}
