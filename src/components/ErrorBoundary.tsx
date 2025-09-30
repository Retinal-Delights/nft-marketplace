"use client";

import { Component, ReactNode } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={6} textAlign="center">
          <VStack spacing={4}>
            <Text fontSize="lg" color="red.400">
              Something went wrong loading the NFTs
            </Text>
            <Text fontSize="sm" color="gray.400">
              {this.state.error?.message || "Unknown error"}
            </Text>
            <Button
              colorScheme="pink"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}
