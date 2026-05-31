import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { PlayerProvider } from '@/components/PlayerProvider'
import { FsAccessProvider } from '@/components/FsAccessProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { TabBar } from '@/components/layout/TabBar'
import { TransportBar } from '@/components/player/TransportBar'
import { NowPlaying } from '@/components/player/NowPlaying'
import { Library } from '@/pages/Library'
import { Albums } from '@/pages/Albums'
import { Settings } from '@/pages/Settings'
import { cn } from '@/lib/utils'

function AppShell() {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null)

  const withScroll = (el: ReactElement) => (scrollParent ? el : null)

  return (
    <div className={cn('h-dvh flex flex-col overflow-hidden md:h-svh md:grid', collapsed ? 'md:grid-cols-[4rem_1fr]' : 'md:grid-cols-[16rem_1fr]')}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main ref={setScrollParent} className="flex-1 overflow-y-auto pb-[8.5rem] md:pb-16">
        <Routes>
          <Route path="/" element={withScroll(<Library scrollParent={scrollParent!} />)} />
          <Route path="/albums" element={withScroll(<Albums scrollParent={scrollParent!} />)} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <TransportBar onNowPlaying={() => setNowPlayingOpen(true)} nowPlayingOpen={nowPlayingOpen} />
      <TabBar />
      <NowPlaying open={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <PlayerProvider>
        <FsAccessProvider>
          <AppShell />
        </FsAccessProvider>
      </PlayerProvider>
    </HashRouter>
  )
}