import { Flex } from '@chakra-ui/react';
import { SETTINGS } from '@/constants/text';
import { LibrarySection } from '@/components/settings/LibrarySection';
import { GlassToggle } from '@/components/settings/GlassToggle';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeading } from '@/components/ui/PageHeading';

export function Settings() {
  return (
    <PageContainer maxW="2xl">
      <PageHeading>{SETTINGS}</PageHeading>
      <Flex flexDir="column" mt="6" gap="4">
        <LibrarySection />
        <GlassToggle />
      </Flex>
    </PageContainer>
  );
}
