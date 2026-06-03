import { Repeat } from 'lucide-react';
import { Text, chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';
import { usePlayer } from '@/contexts/player-context';
import { REPEAT } from '@/constants/text';
import type { RepeatMode } from '@/types';

const MODES: RepeatMode[] = ['off', 'all', 'one'];

export function RepeatButton({
  iconSize = 16,
  badgeRight = '0',
  ...rest
}: { iconSize?: number; badgeRight?: string } & HTMLChakraProps<'button'>) {
  const { repeat, setRepeat } = usePlayer();
  return (
    <chakra.button
      type="button"
      onClick={() => setRepeat(MODES[(MODES.indexOf(repeat) + 1) % MODES.length])}
      aria-label={`${REPEAT}: ${repeat}`}
      aria-pressed={repeat !== 'off'}
      position="relative"
      rounded="full"
      transition="colors"
      color={repeat !== 'off' ? 'primary' : 'mutedForeground'}
      _hover={{ color: 'foreground' }}
      {...rest}
    >
      <Repeat size={iconSize} />
      {repeat === 'one' && (
        <Text position="absolute" top="-0.5" right={badgeRight} fontSize="0.5rem" fontWeight="bold">
          1
        </Text>
      )}
    </chakra.button>
  );
}
