import { Box, chakra } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';

export function Artwork({ src, ...rest }: { src?: string } & BoxProps) {
  if (src) return <chakra.img src={src} alt="" objectFit="cover" {...rest} />;
  return <Box bg="muted" {...rest} />;
}
