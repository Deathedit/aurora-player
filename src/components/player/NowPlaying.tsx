import { usePlayer, usePlayerProgress } from '@/contexts/player-context';
import { formatTime } from '@/utils/time';
import { X, SkipBack, SkipForward } from 'lucide-react';
import { Scrubber } from '@/components/player/Scrubber';
import { ShuffleButton } from '@/components/player/ShuffleButton';
import { RepeatButton } from '@/components/player/RepeatButton';
import { VolumeControl } from '@/components/player/VolumeControl';
import { PlayPauseButton } from '@/components/player/PlayPauseButton';
import { TransportButton } from '@/components/player/TransportButton';
import { Artwork } from '@/components/ui/Artwork';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { useVolumeWheel } from '@/hooks/useVolumeWheel';
import { Box, Dialog, Flex, Portal, Text, chakra } from '@chakra-ui/react';
import { PREVIOUS_TRACK, NEXT_TRACK, CLOSE_NOW_PLAYING } from '@/constants/text';

export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { next, prev } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const current = useCurrentTrack();
  const wheelRef = useVolumeWheel(open);

  if (!current) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Positioner padding={0}>
          <Dialog.Content
            ref={wheelRef}
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
                <Artwork src={current.artUrl} aspectRatio="1" w="full" rounded="xl" shadow="2xl" />
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
                <TransportButton
                  icon={<SkipBack size={24} />}
                  onClick={prev}
                  aria-label={PREVIOUS_TRACK}
                  p="2"
                  color="foreground"
                  _hover={{ color: 'primary' }}
                />
                <PlayPauseButton iconSize={6} boxSize="14" />
                <TransportButton
                  icon={<SkipForward size={24} />}
                  onClick={next}
                  aria-label={NEXT_TRACK}
                  p="2"
                  color="foreground"
                  _hover={{ color: 'primary' }}
                />
                <RepeatButton iconSize={20} p="2" badgeRight="0.5" />
              </Flex>

              <Flex w="full" maxW={{ base: 'sm', md: 'xs' }} alignItems="center" gap="3">
                <VolumeControl sliderProps={{ flex: '1' }} />
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
