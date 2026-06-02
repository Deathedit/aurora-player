import { Container, Flex, Text } from '@chakra-ui/react';
import { SETTINGS } from '@/constants/text';
import { LibrarySection } from '@/components/settings/LibrarySection';
import { GlassToggle } from '@/components/settings/GlassToggle';

export function Settings() {
  return (
    <Container maxW="2xl" px={{ base: '4', sm: '6', lg: '8' }} pt="6">
      <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight">
        {SETTINGS}
      </Text>
      <Flex flexDir="column" mt="6" gap="4">
        <LibrarySection />
        <GlassToggle />
      </Flex>
    </Container>
  );
}
