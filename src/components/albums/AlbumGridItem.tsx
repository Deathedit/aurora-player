import { Text, chakra } from '@chakra-ui/react';
import { Artwork } from '@/components/ui/Artwork';
import type { AlbumGroup } from './types';

export function AlbumGridItem({ album, onSelect }: { album: AlbumGroup; onSelect: () => void }) {
  return (
    <chakra.button
      type="button"
      onClick={onSelect}
      display="flex"
      flexDir="column"
      alignItems="flex-start"
      gap="2"
      overflow="hidden"
      rounded="lg"
      transition="colors"
      _hover={{ bg: 'muted' }}
    >
      <Artwork src={album.artUrl} aspectRatio="1" w="full" rounded="md" />
      <Text w="full" truncate fontSize="sm" fontWeight="medium">
        {album.displayName}
      </Text>
    </chakra.button>
  );
}
