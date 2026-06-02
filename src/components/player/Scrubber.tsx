import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { Box, type BoxProps } from '@chakra-ui/react';

export function Scrubber(props: BoxProps) {
  const { seek } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      role="button"
      position="relative"
      display="flex"
      h="5"
      cursor="pointer"
      alignItems="center"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        seek((x / rect.width) * duration);
      }}
      css={{
        '&:hover .scrubber-track': {
          height: '6px',
        },
      }}
      {...props}
    >
      <Box
        className="scrubber-track"
        h="1"
        w="full"
        rounded="full"
        bg="muted"
        transition="height 0.15s"
        overflow="hidden"
      >
        <Box h="full" rounded="full" layerStyle="accentGradient" style={{ width: `${pct}%` }} />
      </Box>
    </Box>
  );
}
