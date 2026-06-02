import { useFsAccessCtx } from '@/contexts/fs-access-context';
import {
  CONNECT_FOLDER,
  RECONNECT_FOLDER,
  REFRESH_FOLDER,
  DISCONNECT_FOLDER,
  SCANNING,
  FOLDER_NOT_SUPPORTED,
  MUSIC_LIBRARY,
} from '@/constants/text';
import { FolderOpen, RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { SettingsButton } from '@/components/settings/SettingsButton';

const spinCss = { animation: 'spin 1s linear infinite' } as const;

export function LibrarySection() {
  const fs = useFsAccessCtx();

  return (
    <Box rounded="lg" bg="elevated" p="4">
      <Flex flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="3">
        <Text fontSize="sm" fontWeight="medium">
          {MUSIC_LIBRARY}
        </Text>
        {!fs.supported ? (
          <Text fontSize="sm" color="mutedForeground">
            {FOLDER_NOT_SUPPORTED}
          </Text>
        ) : (
          <Flex flexWrap="wrap" alignItems="center" gap="3">
            {!fs.connected && !fs.reconnectNeeded && (
              <SettingsButton
                variant="primary"
                onClick={fs.connect}
                disabled={fs.scanning}
                opacity={fs.scanning ? 0.5 : 1}
                cursor={fs.scanning ? 'not-allowed' : 'pointer'}
              >
                {fs.scanning ? <Loader2 size={16} style={spinCss} /> : <FolderOpen size={16} />}
                {fs.scanning ? SCANNING : CONNECT_FOLDER}
              </SettingsButton>
            )}

            {fs.reconnectNeeded && (
              <SettingsButton variant="primary" onClick={fs.reconnect}>
                <FolderOpen size={16} />
                {RECONNECT_FOLDER}
              </SettingsButton>
            )}

            {fs.connected && !fs.reconnectNeeded && (
              <>
                <Flex alignItems="center" gap="1.5" rounded="md" bg="muted" px="3" py="2" fontSize="sm">
                  <FolderOpen size={16} />
                  {fs.dirName}
                  {fs.scanning && <Loader2 size={14} style={spinCss} />}
                </Flex>
                <SettingsButton
                  variant="muted"
                  onClick={fs.refresh}
                  disabled={fs.scanning}
                  opacity={fs.scanning ? 0.5 : 1}
                  cursor={fs.scanning ? 'not-allowed' : 'pointer'}
                >
                  <RefreshCw size={14} style={fs.scanning ? spinCss : undefined} />
                  {REFRESH_FOLDER}
                </SettingsButton>
                <SettingsButton variant="muted" onClick={fs.disconnect}>
                  <Unplug size={14} />
                  {DISCONNECT_FOLDER}
                </SettingsButton>
              </>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
