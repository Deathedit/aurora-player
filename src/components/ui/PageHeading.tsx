import { Text } from '@chakra-ui/react';
import type { TextProps } from '@chakra-ui/react';

export function PageHeading({ children, ...rest }: TextProps) {
  return (
    <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight" {...rest}>
      {children}
    </Text>
  );
}
