import { Shuffle } from 'lucide-react';
import { chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';
import { usePlayer } from '@/contexts/player-context';

export function ShuffleButton({ iconSize = 16, ...rest }: { iconSize?: number } & HTMLChakraProps<'button'>) {
  const { shuffle, setShuffle } = usePlayer();
  return (
    <chakra.button
      type="button"
      onClick={() => setShuffle(!shuffle)}
      rounded="full"
      transition="colors"
      color={shuffle ? 'primary' : 'mutedForeground'}
      _hover={{ color: 'foreground' }}
      {...rest}
    >
      <Shuffle size={iconSize} />
    </chakra.button>
  );
}
