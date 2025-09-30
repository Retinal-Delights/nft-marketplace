"use client";
import { Box, Heading, Text, Stack, Input, Textarea, Button } from "@chakra-ui/react";

export default function ContactPage() {
  return (
    <Box px={6} py={10} maxW="900px" mx="auto">
      <Heading size="xl" mb={2}>Contact</Heading>
      <Text color="gray.400" mb={8}>Questions, collabs, or press.</Text>

      <Stack spacing={4} maxW="600px">
        <Input placeholder="Your email" />
        <Input placeholder="Subject" />
        <Textarea placeholder="Message" rows={6} />
        <Button colorScheme="pink">Send</Button>
        <Text fontSize="sm" color="gray.500">
          (Hook this up to your preferred form backend when ready.)
        </Text>
      </Stack>
    </Box>
  );
}
