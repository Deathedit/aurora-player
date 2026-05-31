import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
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

  return (
    <div className={cn('h-dvh flex flex-col overflow-hidden md:min-h-svh md:overflow-auto md:grid', collapsed ? 'md:grid-cols-[4rem_1fr]' : 'md:grid-cols-[16rem_1fr]')}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto pb-[8.5rem] md:overflow-visible md:pb-0 md:mb-16">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <TransportBar onNowPlaying={() => setNowPlayingOpen(true)} />
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