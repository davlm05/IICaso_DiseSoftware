import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { Input } from "../src/components/atoms/Input";
import { Toast } from "../src/components/atoms/Toast";
import { useAuthStore } from "../src/store/authStore";

/**
 * LoginScreen (README §1.3 Authentication — "User submits email + password
 * (validated client-side with Zod)").
 *
 * Only `email` and `password` are requested here, per the
 * `POST /auth/login` contract. `fullName`/`phone`/`role` are part of the
 * `User` entity but are only edited from EditUserScreen
 * (`/app/profile.tsx`), not at login time.
 */
export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    // Minimal client-side shape check; full Zod schema lives with the
    // shared auth DTOs (README §1.3 / §1.9 packages/shared-types).
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Correo inválido.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-3 p-lg">
        <Text className="text-center font-display text-2xl text-text-primary">
          Smart<Text className="text-primary">Cart</Text>
        </Text>
        <Text className="mb-2 text-center font-body text-sm text-text-secondary">
          Inicia sesión para empezar a acumular puntos
        </Text>

        {error ? <Toast message={error} tone="error" visible onDismiss={() => setError(null)} /> : null}

        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="correo@ejemplo.com"
        />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <View className="mt-2">
          <Button
            label={submitting ? "Iniciando…" : "Iniciar sesión"}
            variant="primary"
            onPress={handleSubmit}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
