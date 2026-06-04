import { Container } from '@chakra-ui/react';
import type { ContainerProps } from '@chakra-ui/react';

export function PageContainer({ children, ...rest }: ContainerProps) {
  return (
    <Container maxW="6xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6" {...rest}>
      {children}
    </Container>
  );
}
