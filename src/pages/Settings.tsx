import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFsAccessCtx } from '@/fs-access-context';
import {
  CONNECT_FOLDER,
  RECONNECT_FOLDER,
  REFRESH_FOLDER,
  DISCONNECT_FOLDER,
  SCANNING,
  FOLDER_NOT_SUPPORTED,
  THEME_LABEL,
  GLASS_LABEL,
  DARK,
  SPOTIFY,
} from '@/text';
import type { Theme } from '@/types';
import { FolderOpen, RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { Box, Container, Flex, Text, chakra } from '@chakra-ui/react';

export function Settings() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', DARK);
  const [glass, setGlass] = useLocalStorage<boolean>('glass', true);
  const fs = useFsAccessCtx();

  function handleTheme(t: Theme) {
    setTheme(t);
    if (t === DARK) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('spotify');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('spotify');
    }
  }

  function handleGlass(next: boolean) {
    setGlass(next);
    document.documentElement.classList.toggle('no-glass', !next);
  }

  const spinCss = { animation: 'spin 1s linear infinite' } as const;

  return (
    <Container maxW="2xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6">
      <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
        Settings
      </Text>
      <Flex flexDir="column" mt="6" gap="4">
        <Box rounded="lg" bg="elevated" p="4">
          <Flex flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="3">
            <Text fontSize="sm" fontWeight="medium">
              Music Library
            </Text>
            {!fs.supported ? (
              <Text fontSize="sm" color="mutedForeground">
                {FOLDER_NOT_SUPPORTED}
              </Text>
            ) : (
              <Flex flexWrap="wrap" alignItems="center" gap="3">
                {!fs.connected && !fs.reconnectNeeded && (
                  <chakra.button
                    type="button"
                    onClick={fs.connect}
                    disabled={fs.scanning}
                    display="flex"
                    alignItems="center"
                    gap="2"
                    rounded="md"
                    bg="primary"
                    px="4"
                    py="2"
                    fontSize="sm"
                    fontWeight="medium"
                    color="primaryForeground"
                    transition="opacity 0.15s"
                    _hover={{ opacity: 0.9 }}
                    opacity={fs.scanning ? 0.5 : 1}
                    cursor={fs.scanning ? 'not-allowed' : 'pointer'}
                  >
                    {fs.scanning ? <Loader2 size={16} style={spinCss} /> : <FolderOpen size={16} />}
                    {fs.scanning ? SCANNING : CONNECT_FOLDER}
                  </chakra.button>
                )}

                {fs.reconnectNeeded && (
                  <chakra.button
                    type="button"
                    onClick={fs.reconnect}
                    display="flex"
                    alignItems="center"
                    gap="2"
                    rounded="md"
                    bg="primary"
                    px="4"
                    py="2"
                    fontSize="sm"
                    fontWeight="medium"
                    color="primaryForeground"
                    transition="opacity 0.15s"
                    _hover={{ opacity: 0.9 }}
                  >
                    <FolderOpen size={16} />
                    {RECONNECT_FOLDER}
                  </chakra.button>
                )}

                {fs.connected && !fs.reconnectNeeded && (
                  <>
                    <Flex alignItems="center" gap="1.5" rounded="md" bg="muted" px="3" py="2" fontSize="sm">
                      <FolderOpen size={16} />
                      {fs.dirName}
                      {fs.scanning && <Loader2 size={14} style={spinCss} />}
                    </Flex>
                    <chakra.button
                      type="button"
                      onClick={fs.refresh}
                      disabled={fs.scanning}
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                      rounded="md"
                      bg="muted"
                      px="3"
                      py="2"
                      fontSize="sm"
                      fontWeight="medium"
                      color="foreground"
                      transition="opacity 0.15s"
                      _hover={{ opacity: 0.8 }}
                      opacity={fs.scanning ? 0.5 : 1}
                      cursor={fs.scanning ? 'not-allowed' : 'pointer'}
                    >
                      <RefreshCw size={14} style={fs.scanning ? spinCss : undefined} />
                      {REFRESH_FOLDER}
                    </chakra.button>
                    <chakra.button
                      type="button"
                      onClick={fs.disconnect}
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                      rounded="md"
                      bg="muted"
                      px="3"
                      py="2"
                      fontSize="sm"
                      fontWeight="medium"
                      color="foreground"
                      transition="opacity 0.15s"
                      _hover={{ opacity: 0.8 }}
                    >
                      <Unplug size={14} />
                      {DISCONNECT_FOLDER}
                    </chakra.button>
                  </>
                )}
              </Flex>
            )}
          </Flex>
        </Box>

        <Flex alignItems="center" justifyContent="space-between" rounded="lg" bg="elevated" p="4">
          <Text fontSize="sm" fontWeight="medium">
            {THEME_LABEL}
          </Text>
          <Flex gap="2">
            <chakra.button
              type="button"
              onClick={() => handleTheme(SPOTIFY)}
              rounded="md"
              px="3"
              py="1.5"
              fontSize="sm"
              bg={theme === SPOTIFY ? 'primary' : 'muted'}
              color={theme === SPOTIFY ? 'primaryForeground' : 'foreground'}
              cursor="pointer"
            >
              Spotify
            </chakra.button>
            <chakra.button
              type="button"
              onClick={() => handleTheme(DARK)}
              rounded="md"
              px="3"
              py="1.5"
              fontSize="sm"
              bg={theme === DARK ? 'primary' : 'muted'}
              color={theme === DARK ? 'primaryForeground' : 'foreground'}
              cursor="pointer"
            >
              Dark
            </chakra.button>
          </Flex>
        </Flex>

        <Flex alignItems="center" justifyContent="space-between" rounded="lg" bg="elevated" p="4">
          <Text fontSize="sm" fontWeight="medium">
            {GLASS_LABEL}
          </Text>
          <chakra.button
            type="button"
            onClick={() => handleGlass(!glass)}
            position="relative"
            h="6"
            w="11"
            rounded="full"
            transition="colors"
            bg={glass ? 'primary' : 'muted'}
            cursor="pointer"
          >
            <Box
              position="absolute"
              left="0.5"
              top="0.5"
              boxSize="5"
              rounded="full"
              bg="white"
              transition="transform 0.15s"
              transform={glass ? 'translateX(20px)' : 'translateX(0)'}
            />
          </chakra.button>
        </Flex>
      </Flex>
    </Container>
  );
}
