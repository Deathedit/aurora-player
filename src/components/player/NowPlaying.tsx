import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { X, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { Scrubber } from '@/components/player/Scrubber';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { RepeatButton } from '@/components/player/RepeatButton';
import { VolumeControl } from '@/components/player/VolumeControl';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';
import { useRef } from 'react';
import { Box, Dialog, Flex, Portal, Text, chakra } from '@chakra-ui/react';
import { PLAY, PAUSE, PREVIOUS_TRACK, NEXT_TRACK, CLOSE_NOW_PLAYING } from '@/constants/text';

export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isPlaying, toggle, next, prev } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useCurrentTrack();
  const volumeRowRef = useRef<HTMLDivElement>(null);
  useVolumeWheel(volumeRowRef, open);

  if (!current) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Positioner padding={0}>
          <Dialog.Content
            layerStyle="glassElevated"
            position="fixed"
            inset={0}
            w="100vw"
            h="100dvh"
            maxW="100vw"
            maxH="100dvh"
            m={0}
            rounded="none"
            boxShadow="none"
            zIndex={50}
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            gap="6"
            p={{ base: '6', md: '10' }}
            css={{
              '--player-glow': `radial-gradient(at 50% 0%, var(--art, #1db954) 22%, transparent)`,
            }}
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label={CLOSE_NOW_PLAYING}
                position="absolute"
                right="4"
                top="4"
                color="mutedForeground"
                _hover={{ color: 'foreground' }}
              >
                <X size={24} />
              </chakra.button>
            </Dialog.CloseTrigger>

            <Flex w="full" maxW={{ base: 'md', md: 'lg' }} flexDir="column" alignItems="center" gap="6">
              <Box position="relative" w="full" maxW={{ base: 'sm', md: 'md' }}>
                {current.artUrl ? (
                  <chakra.img
                    src={current.artUrl}
                    alt=""
                    aspectRatio="1"
                    w="full"
                    rounded="xl"
                    objectFit="cover"
                    shadow="2xl"
                  />
                ) : (
                  <Box aspectRatio="1" w="full" rounded="xl" bg="muted" />
                )}
                <Box
                  pointerEvents="none"
                  position="absolute"
                  inset={0}
                  rounded="xl"
                  css={{
                    background: 'var(--player-glow)',
                    opacity: 0.15,
                  }}
                />
              </Box>

              <Box w="full" textAlign="center">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  {current.title}
                </Dialog.Title>
                <Dialog.Description fontSize="sm" color="mutedForeground">
                  {current.artist}
                </Dialog.Description>
              </Box>

              <Box w="full">
                <Scrubber w="full" />
                <Flex
                  mt="1"
                  justifyContent="space-between"
                  fontSize="xs"
                  color="mutedForeground"
                  css={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  <Text>{formatTime(currentTime)}</Text>
                  <Text>{formatTime(duration)}</Text>
                </Flex>
              </Box>

              <Flex w="full" alignItems="center" justifyContent="space-between">
                <ShuffleButton iconSize={20} p="2" />
                <chakra.button
                  type="button"
                  onClick={prev}
                  aria-label={PREVIOUS_TRACK}
                  rounded="full"
                  p="2"
                  color="foreground"
                  _hover={{ color: 'primary' }}
                >
                  <SkipBack size={24} />
                </chakra.button>
                <chakra.button
                  type="button"
                  onClick={toggle}
                  aria-label={isPlaying ? PAUSE : PLAY}
                  layerStyle="accentGradient"
                  display="flex"
                  boxSize="14"
                  alignItems="center"
                  justifyContent="center"
                  rounded="full"
                  color="primaryForeground"
                  _active={{ transform: 'scale(0.95)' }}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }} />}
                </chakra.button>
                <chakra.button
                  type="button"
                  onClick={next}
                  aria-label={NEXT_TRACK}
                  rounded="full"
                  p="2"
                  color="foreground"
                  _hover={{ color: 'primary' }}
                >
                  <SkipForward size={24} />
                </chakra.button>
                <RepeatButton iconSize={20} p="2" badgeRight="0.5" />
              </Flex>

              <Flex ref={volumeRowRef} w="full" maxW={{ base: 'sm', md: 'xs' }} alignItems="center" gap="3">
                <VolumeControl sliderProps={{ flex: '1' }} />
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
