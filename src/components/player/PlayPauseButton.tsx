import { usePlayer } from '@/contexts/player-context';
import { Play, Pause } from 'lucide-react';
import { chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';
import { PLAY, PAUSE } from '@/constants/text';

const CPlay = chakra(Play);
const CPause = chakra(Pause);

export function PlayPauseButton({
  iconSize,
  ...rest
}: { iconSize: HTMLChakraProps<'svg'>['boxSize'] } & HTMLChakraProps<'button'>) {
  const { isPlaying, toggle } = usePlayer();
  return (
    <chakra.button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? PAUSE : PLAY}
      layerStyle="accentGradient"
      display="flex"
      alignItems="center"
      justifyContent="center"
      rounded="full"
      color="primaryForeground"
      _active={{ transform: 'scale(0.95)' }}
      {...rest}
    >
      {isPlaying ? <CPause boxSize={iconSize} /> : <CPlay boxSize={iconSize} ml="0.5" />}
    </chakra.button>
  );
}
