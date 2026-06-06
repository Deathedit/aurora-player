import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, Portal, Text, chakra } from '@chakra-ui/react';
import { usePlayer } from '@/contexts/player-context';
import { TrackRow } from '@/components/library/TrackRow';
import { NO_RESULTS, SEARCH_LIBRARY, SEARCH_PLACEHOLDER } from '@/constants/text';
import type { Track } from '@/types';

const MAX_RESULTS = 50;

export function SearchDialog({ tracks, nowPlayingOpen = false }: { tracks: Track[]; nowPlayingOpen?: boolean }) {
  const { play } = usePlayer();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'k') return;
      if (nowPlayingOpen) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nowPlayingOpen]);

  const focusRef = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tracks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [tracks, query]);

  useEffect(() => {
    (listRef.current?.children[selectedIndex] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const t = results[selectedIndex];
      if (t) {
        play(t.id);
        close();
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && close()}>
      <Portal>
        <Dialog.Backdrop layerStyle="glassBackdrop" position="fixed" inset="0" zIndex={40} />
        <Dialog.Positioner padding={{ base: '4', md: '16' }} alignItems="flex-start">
          <Dialog.Content
            layerStyle="glassElevated"
            w="full"
            maxW="xl"
            p="3"
            rounded="xl"
            zIndex={50}
            display="flex"
            flexDir="column"
            gap="3"
          >
            <Dialog.Title srOnly>{SEARCH_LIBRARY}</Dialog.Title>
            <chakra.input
              ref={focusRef}
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder={SEARCH_PLACEHOLDER}
              w="full"
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
            {query.trim() && (
              <Box
                ref={listRef}
                maxH="60dvh"
                overflowY="auto"
                onClick={close}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
              >
                {results.length === 0 ? (
                  <Text px="3" py="2" fontSize="sm" color="mutedForeground">
                    {NO_RESULTS}
                  </Text>
                ) : (
                  results.map((t, i) => <TrackRow key={t.id} track={t} index={i} selected={i === selectedIndex} />)
                )}
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
