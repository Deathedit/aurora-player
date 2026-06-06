import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { Box, Grid } from '@chakra-ui/react';
import { PlayerProvider } from '@/components/PlayerProvider';
import { LibrarySourceProvider } from '@/components/LibrarySourceProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabBar } from '@/components/layout/TabBar';
import { TransportBar } from '@/components/player/TransportBar';
import { NowPlaying } from '@/components/player/NowPlaying';
import { Library } from '@/pages/Library';
import { Albums } from '@/pages/Albums';
import { Settings } from '@/pages/Settings';

function AppShell() {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  const toggleNowPlaying = useCallback(() => setNowPlayingOpen((o) => !o), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      toggleNowPlaying();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleNowPlaying]);

  const withScroll = (el: ReactElement) => (scrollParent ? el : null);

  return (
    <Grid
      h="100dvh"
      overflow="hidden"
      gridTemplateColumns={{
        base: '1fr',
        md: collapsed ? '4rem 1fr' : '16rem 1fr',
      }}
      gridTemplateRows={{ base: '1fr', md: '1fr' }}
      css={{
        '@media (max-width: 767px)': {
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Box
        as="main"
        ref={setScrollParent as React.Ref<HTMLDivElement>}
        flex="1"
        overflowY="auto"
        pb={{ base: '8.5rem', md: '4rem' }}
      >
        <Routes>
          <Route
            path="/"
            element={withScroll(<Library scrollParent={scrollParent!} nowPlayingOpen={nowPlayingOpen} />)}
          />
          <Route path="/albums" element={withScroll(<Albums scrollParent={scrollParent!} />)} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>

      <TransportBar onNowPlaying={toggleNowPlaying} nowPlayingOpen={nowPlayingOpen} />
      <TabBar />
      <NowPlaying open={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />
    </Grid>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <LibrarySourceProvider>
          <AppShell />
        </LibrarySourceProvider>
      </PlayerProvider>
    </BrowserRouter>
  );
}
