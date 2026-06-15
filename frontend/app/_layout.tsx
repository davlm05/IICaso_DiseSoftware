import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Component, type ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../src/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 60_000,
    },
  },
});

/** Per-feature Error Boundary (README §1.5 Error Handling & Observability). */
class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Forwarded to Sentry in production (README §1.5 Monitoring).
    console.error("RootErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background p-lg">
          <Text className="text-center font-heading text-base text-text-primary">
            Algo salió mal. Vuelve a intentarlo.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootErrorBoundary>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="index" />
            <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="confirmation" />
            <Stack.Screen name="rewards" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="create-user" options={{ presentation: "modal" }} />
          </Stack>
        </RootErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
