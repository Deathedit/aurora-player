import { VolumeIcon } from '@/components/ui/volume-icon';
import { Text, chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';
import { usePlayer } from '@/contexts/player-context';
import { MUTE, UNMUTE, VOLUME } from '@/constants/text';

const tabularNumsCss = { fontVariantNumeric: 'tabular-nums' } as const;

export function VolumeControl({ sliderProps }: { sliderProps?: HTMLChakraProps<'input'> }) {
  const { volume, setVolume } = usePlayer();
  return (
    <>
      <chakra.button
        type="button"
        onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
        aria-label={volume === 0 ? UNMUTE : MUTE}
        display="flex"
        boxSize="5"
        alignItems="center"
        justifyContent="center"
        color="mutedForeground"
        transition="colors"
        _hover={{ color: 'foreground' }}
      >
        <VolumeIcon volume={volume} style={{ width: 16, height: 16 }} />
      </chakra.button>
      <chakra.input
        type="range"
        aria-label={VOLUME}
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))}
        accentColor="var(--chakra-colors-primary)"
        {...sliderProps}
      />
      <Text w="9" flexShrink={0} textAlign="right" fontSize="xs" color="mutedForeground" css={tabularNumsCss}>
        {Math.round(volume * 100)}%
      </Text>
    </>
  );
}
