import { useLocalStorage } from '@/hooks/useLocalStorage';
import { GLASS_LABEL } from '@/constants/text';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';

export function GlassToggle() {
  const [glass, setGlass] = useLocalStorage<boolean>('glass', true);

  function handleGlass(next: boolean) {
    setGlass(next);
    document.documentElement.classList.toggle('no-glass', !next);
  }

  return (
    <Flex alignItems="center" justifyContent="space-between" rounded="lg" bg="elevated" p="4">
      <Text id="glass-toggle-label" fontSize="sm" fontWeight="medium">
        {GLASS_LABEL}
      </Text>
      <chakra.button
        type="button"
        onClick={() => handleGlass(!glass)}
        role="switch"
        aria-checked={glass}
        aria-labelledby="glass-toggle-label"
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
  );
}
