import { chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function TransportButton({ icon, ...rest }: { icon: ReactNode } & HTMLChakraProps<'button'>) {
  return (
    <chakra.button type="button" rounded="full" {...rest}>
      {icon}
    </chakra.button>
  );
}
