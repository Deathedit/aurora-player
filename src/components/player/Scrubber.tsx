import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { SEEK } from '@/constants/text';
import { Box, type BoxProps } from '@chakra-ui/react';

const STEP = 5;

export function Scrubber(props: BoxProps) {
  const { seek } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = currentTime - STEP;
    else if (e.key === 'ArrowRight') next = currentTime + STEP;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = duration;
    if (next === null) return;
    e.preventDefault();
    seek(Math.max(0, Math.min(duration, next)));
  };

  return (
    <Box
      role="slider"
      tabIndex={0}
      aria-label={SEEK}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatTime(currentTime)}
      position="relative"
      display="flex"
      h="5"
      cursor="pointer"
      alignItems="center"
      onKeyDown={onKeyDown}
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
