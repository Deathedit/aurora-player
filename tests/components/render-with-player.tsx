import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';
import { PlayerCtx, PlayerProgressCtx } from '@/contexts/player-context';
import type { PlayerContextType, PlayerProgress } from '@/contexts/player-context';

export function renderWithPlayer(
  ui: ReactElement,
  opts?: { player?: Partial<PlayerContextType>; progress?: Partial<PlayerProgress> },
) {
  const player = { ...opts?.player } as unknown as PlayerContextType;
  const progress: PlayerProgress = { currentTime: 0, duration: 0, ...opts?.progress };

  return render(
    <ChakraProvider value={system}>
      <PlayerCtx.Provider value={player}>
        <PlayerProgressCtx.Provider value={progress}>{ui}</PlayerProgressCtx.Provider>
      </PlayerCtx.Provider>
    </ChakraProvider>,
  );
}
