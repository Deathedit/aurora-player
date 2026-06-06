import { usePlayer } from '@/contexts/player-context';
import { useLibrarySource } from '@/contexts/library-source-context';
import { TrackRow } from '@/components/library/TrackRow';
import { EMPTY_LIBRARY, EMPTY_LIBRARY_SERVER, LIBRARY, SEARCH_PLACEHOLDER, TRACK_COUNT } from '@/constants/text';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { Track } from '@/types';
import { Box, Text, chakra } from '@chakra-ui/react';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeading } from '@/components/ui/PageHeading';

const renderTrack = (i: number, track: Track) => <TrackRow track={track} index={i} />;

export function Library({ scrollParent }: { scrollParent: HTMLElement }) {
  const { library } = usePlayer();
  const { mode } = useLibrarySource();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () =>
      [...library].sort(
        (a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.title.localeCompare(b.title),
      ),
    [library],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((t) => t.title.toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'k') return;
      e.preventDefault();
      setShowSearch(true);
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (showSearch) inputRef.current?.focus();
  }, [showSearch]);

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
        {TRACK_COUNT(visible.length)}
      </Text>
      {showSearch && (
        <chakra.input
          ref={inputRef}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
              setQuery('');
              setShowSearch(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={SEARCH_PLACEHOLDER}
          mt="3"
          w="full"
          maxW="md"
          px="3"
          py="2"
          fontSize="sm"
          rounded="md"
          bg="elevated"
          color="foreground"
          borderWidth="1px"
          borderColor="border"
          _placeholder={{ color: 'mutedForeground' }}
          _focusVisible={{ borderColor: 'primary', outline: 'none' }}
        />
      )}
      <Box mt="4">
        <Virtuoso data={visible} itemContent={renderTrack} fixedItemHeight={56} customScrollParent={scrollParent} />
      </Box>
    </PageContainer>
  );
}
