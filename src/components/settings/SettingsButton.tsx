import { chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';

const variants = {
  primary: { bg: 'primary', color: 'primaryForeground', px: '4', gap: '2', _hover: { opacity: 0.9 } },
  muted: { bg: 'muted', color: 'foreground', px: '3', gap: '1.5', _hover: { opacity: 0.8 } },
} as const;

export function SettingsButton({
  variant,
  ...rest
}: { variant: 'primary' | 'muted' } & HTMLChakraProps<'button'>) {
  return (
    <chakra.button
      type="button"
      display="flex"
      alignItems="center"
      rounded="md"
      py="2"
      fontSize="sm"
      fontWeight="medium"
      transition="opacity 0.15s"
      {...variants[variant]}
      {...rest}
    />
  );
}
