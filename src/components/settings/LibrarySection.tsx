import { useFsAccessCtx } from '@/contexts/fs-access-context';
import { useLibrarySource } from '@/contexts/library-source-context';
import {
  CONNECT_FOLDER,
  RECONNECT_FOLDER,
  REFRESH_FOLDER,
  DISCONNECT_FOLDER,
  SCANNING,
  FOLDER_NOT_SUPPORTED,
  MUSIC_LIBRARY,
  SERVER_LIBRARY,
  RESCAN_LIBRARY,
} from '@/constants/text';
import { FolderOpen, RefreshCw, Unplug, Loader2, Server } from 'lucide-react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { SettingsButton } from '@/components/settings/SettingsButton';

const spinCss = { animation: 'spin 1s linear infinite' } as const;

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <Box rounded="lg" bg="elevated" p="4">
      <Flex flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="3">
        <Text fontSize="sm" fontWeight="medium">
          {MUSIC_LIBRARY}
        </Text>
        {children}
      </Flex>
    </Box>
  );
}

function ServerLibrarySection() {
  const { refresh, refreshing } = useLibrarySource();
  return (
    <SectionShell>
      <Flex flexWrap="wrap" alignItems="center" gap="3">
        <Flex alignItems="center" gap="1.5" rounded="md" bg="muted" px="3" py="2" fontSize="sm">
          <Server size={16} />
          {SERVER_LIBRARY}
        </Flex>
        <SettingsButton
          variant="muted"
          onClick={refresh}
          disabled={refreshing}
          opacity={refreshing ? 0.5 : 1}
          cursor={refreshing ? 'not-allowed' : 'pointer'}
        >
          <RefreshCw size={14} style={refreshing ? spinCss : undefined} />
          {RESCAN_LIBRARY}
        </SettingsButton>
      </Flex>
    </SectionShell>
  );
}

function LocalLibrarySection() {
  const fs = useFsAccessCtx();
  return (
    <SectionShell>
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
    </SectionShell>
  );
}

export function LibrarySection() {
  const { mode } = useLibrarySource();
  return mode === 'backend' ? <ServerLibrarySection /> : <LocalLibrarySection />;
}
