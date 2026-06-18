import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/authStore";
import "../src/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 60_000,
    },
  },
});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    // Forwarded to Sentry in production (README §1.5 Monitoring).
    console.error("RootErrorBoundary", error);
  }, [error]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ textAlign: 'center', fontSize: 16 }}>
        Algo salió mal. Vuelve a intentarlo.
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: 'red' }}>
        {error.message}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  // Restore a persisted session (SecureStore token → GET /users/me) on launch.
  // Screens gate on `authStore.hydrated`/`status` (see app/index.tsx).
  useEffect(() => {
    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="create-user" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="confirmation" />
        <Stack.Screen name="rewards" />
      </Stack>
    </QueryClientProvider>
  );
}
