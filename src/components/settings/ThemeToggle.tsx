import { useLocalStorage } from '@/hooks/useLocalStorage';
import { THEME_LABEL, THEME_DARK_LABEL, THEME_SPOTIFY_LABEL } from '@/constants/text';
import { DARK, SPOTIFY } from '@/types';
import type { Theme } from '@/types';
import { Flex, Text, chakra } from '@chakra-ui/react';

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', DARK);

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

  return (
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
          {THEME_SPOTIFY_LABEL}
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
          {THEME_DARK_LABEL}
        </chakra.button>
      </Flex>
    </Flex>
  );
}
