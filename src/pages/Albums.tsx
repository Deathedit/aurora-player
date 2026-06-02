import { usePlayer } from '@/contexts/player-context';
import { NO_ALBUMS, ALBUMS } from '@/constants/text';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LayoutGrid, List } from 'lucide-react';
import type { Track } from '@/types';
import { Box, Container, Flex, SimpleGrid, Text, chakra } from '@chakra-ui/react';
import { AlbumDetail } from '@/components/albums/AlbumDetail';
import { AlbumListRow } from '@/components/albums/AlbumListRow';
import { AlbumGridItem } from '@/components/albums/AlbumGridItem';
import type { AlbumGroup } from '@/components/albums/types';

function albumKey(t: Track): string {
  return t.folder ?? t.album;
}

function albumDisplayName(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1];
}

export function Albums({ scrollParent }: { scrollParent: HTMLElement }) {
  const { library } = usePlayer();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [view, setView] = useLocalStorage<'grid' | 'list'>('albumView', 'grid');

  const albums = useMemo(() => {
    const map = new Map<string, AlbumGroup>();
    for (const t of library) {
      const key = albumKey(t);
      if (!map.has(key)) {
        map.set(key, {
          key,
          displayName: albumDisplayName(key),
          artUrl: t.artUrl,
          tracks: [],
        });
      }
      map.get(key)!.tracks.push(t);
    }
    return map;
  }, [library]);

  const sortedAlbums = useMemo(
    () => [...albums.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [albums],
  );

  if (library.length === 0) {
    return (
      <Container maxW="6xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6">
        <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
          {ALBUMS}
        </Text>
        <Text mt="4" color="mutedForeground">
          {NO_ALBUMS}
        </Text>
      </Container>
    );
  }

  const album = selectedAlbum ? albums.get(selectedAlbum) : null;

  return (
    <Container maxW="6xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6" pb="4">
      {album ? (
        <AlbumDetail album={album} scrollParent={scrollParent} onBack={() => setSelectedAlbum(null)} />
      ) : (
        <>
          <Flex alignItems="center" justifyContent="space-between">
            <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
              {ALBUMS}
            </Text>
            <Flex alignItems="center" gap="1">
              <chakra.button
                type="button"
                onClick={() => setView('grid')}
                rounded="md"
                p="1.5"
                transition="colors"
                color={view === 'grid' ? 'primary' : 'mutedForeground'}
                bg={view === 'grid' ? 'primaryTintStrong' : undefined}
                _hover={{ color: view === 'grid' ? 'primary' : 'foreground' }}
              >
                <LayoutGrid size={16} />
              </chakra.button>
              <chakra.button
                type="button"
                onClick={() => setView('list')}
                rounded="md"
                p="1.5"
                transition="colors"
                color={view === 'list' ? 'primary' : 'mutedForeground'}
                bg={view === 'list' ? 'primaryTintStrong' : undefined}
                _hover={{ color: view === 'list' ? 'primary' : 'foreground' }}
              >
                <List size={16} />
              </chakra.button>
            </Flex>
          </Flex>
          {view === 'list' ? (
            <Box mt="4">
              <Virtuoso
                data={sortedAlbums}
                itemContent={(_i, a) => <AlbumListRow album={a} onSelect={() => setSelectedAlbum(a.key)} />}
                fixedItemHeight={64}
                customScrollParent={scrollParent}
              />
            </Box>
          ) : (
            <SimpleGrid mt="6" columns={{ base: 2, sm: 3, lg: 4, xl: 6 }} gap="4">
              {sortedAlbums.map((a) => (
                <AlbumGridItem key={a.key} album={a} onSelect={() => setSelectedAlbum(a.key)} />
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </Container>
  );
}
