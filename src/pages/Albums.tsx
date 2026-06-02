import { usePlayer } from '@/player-context';
import { TrackRow } from '@/components/library/TrackRow';
import { NO_ALBUMS } from '@/text';
import { formatTime } from '@/text';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LayoutGrid, List } from 'lucide-react';
import type { Track } from '@/types';
import { Box, Container, Flex, SimpleGrid, Text, chakra } from '@chakra-ui/react';

function albumKey(t: Track): string {
  return t.folder ?? t.album;
}

function albumDisplayName(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1];
}

interface AlbumGroup {
  key: string;
  displayName: string;
  artUrl?: string;
  tracks: Track[];
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
          Albums
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
        <>
          <chakra.button
            type="button"
            onClick={() => setSelectedAlbum(null)}
            mb="4"
            fontSize="sm"
            color="primary"
            _hover={{ textDecoration: 'underline' }}
          >
            &larr; All Albums
          </chakra.button>
          <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
            {album.displayName}
          </Text>
          <Text mt="1" fontSize="sm" color="mutedForeground">
            {album.tracks.length} tracks
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
      ) : (
        <>
          <Flex alignItems="center" justifyContent="space-between">
            <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
              Albums
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
                itemContent={(_i, a) => (
                  <chakra.button
                    type="button"
                    onClick={() => setSelectedAlbum(a.key)}
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
                    {a.artUrl ? (
                      <chakra.img src={a.artUrl} alt="" boxSize="12" flexShrink={0} rounded="sm" objectFit="cover" />
                    ) : (
                      <Box boxSize="12" flexShrink={0} rounded="sm" bg="muted" />
                    )}
                    <Box minW={0} flex="1" textAlign="left">
                      <Text truncate fontSize="sm" fontWeight="medium">
                        {a.displayName}
                      </Text>
                      <Text fontSize="xs" color="mutedForeground">
                        {a.tracks.length} tracks &middot; {formatTime(a.tracks.reduce((s, t) => s + t.durationSec, 0))}
                      </Text>
                    </Box>
                  </chakra.button>
                )}
                fixedItemHeight={64}
                customScrollParent={scrollParent}
              />
            </Box>
          ) : (
            <SimpleGrid mt="6" columns={{ base: 2, sm: 3, lg: 4, xl: 6 }} gap="4">
              {sortedAlbums.map((a) => (
                <chakra.button
                  key={a.key}
                  type="button"
                  onClick={() => setSelectedAlbum(a.key)}
                  display="flex"
                  flexDir="column"
                  alignItems="flex-start"
                  gap="2"
                  overflow="hidden"
                  rounded="lg"
                  transition="colors"
                  _hover={{ bg: 'muted' }}
                >
                  {a.artUrl ? (
                    <chakra.img src={a.artUrl} alt="" aspectRatio="1" w="full" rounded="md" objectFit="cover" />
                  ) : (
                    <Box aspectRatio="1" w="full" rounded="md" bg="muted" />
                  )}
                  <Text w="full" truncate fontSize="sm" fontWeight="medium">
                    {a.displayName}
                  </Text>
                </chakra.button>
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </Container>
  );
}
