import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { Icon } from "../src/components/atoms/Icon";
import { Input } from "../src/components/atoms/Input";
import { Toast } from "../src/components/atoms/Toast";
import { ROLES, type Role } from "../src/types";
import { useAuthStore } from "../src/store/authStore";

/**
 * CreateUserScreen (reached only from EditUserScreen's "Crear usuario"
 * button, which is itself only rendered for SUPER_ADMIN — README §1.3 RBAC:
 * "SUPER_ADMIN ... User & role management ... Full back-office authority").
 *
 * Requests the same fields as EditUserScreen: email, fullName, password,
 * phone, role. In production this maps to an admin-only endpoint
 * (e.g. `POST /users` guarded by `@Roles(SUPER_ADMIN)`), distinct from the
 * public `POST /auth/register` used at signup.
 */
export default function CreateUserScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const createUser = useAuthStore((s) => s.createUser);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState<string | null>(null);

  // UI-side guard mirroring the future server-side RolesGuard.
  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background p-lg">
        <Icon name="ShieldAlert" size={32} color="#DC2626" decorative={false} />
        <Text className="mt-2 text-center font-heading text-base text-text-primary">
          Solo un SUPER_ADMIN puede crear usuarios.
        </Text>
        <View className="mt-3">
          <Button label="Volver" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError("Correo, contraseña y nombre completo son obligatorios.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Correo inválido.");
      return;
    }

    createUser({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      role,
    });

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-background bg-surface px-md py-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-success/20"
        >
          <Icon name="ArrowLeft" size={16} color="#15803D" />
        </Pressable>
        <Text className="font-display text-base text-text-primary">Crear usuario</Text>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-md">
        {error ? <Toast message={error} tone="error" visible onDismiss={() => setError(null)} /> : null}

        <Input label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" />

        <Input label="Nombre completo" value={fullName} onChangeText={setFullName} />

        <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <Input label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <View className="gap-1">
          <Text className="font-body text-xs uppercase tracking-wide text-text-secondary">Rol</Text>
          <View className="flex-row flex-wrap gap-2">
            {ROLES.map((r) => {
              const selected = role === r;
              return (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setRole(r)}
                  className={`rounded-2xl border px-3 py-2 ${
                    selected ? "border-primary bg-primary/10" : "border-background bg-surface"
                  }`}
                >
                  <Text className={`font-heading text-xs ${selected ? "text-primary" : "text-text-secondary"}`}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-2 rounded-2xl border border-success/40 bg-success/10 p-md">
          <Icon name="Info" size={14} color="#15803D" decorative={false} />
          <Text className="flex-1 font-body text-xs text-text-secondary">
            Esta pantalla solo está disponible para usuarios <Text className="font-heading text-secondary">SUPER_ADMIN</Text>.
          </Text>
        </View>

        <Button label="Crear usuario" variant="primary" onPress={handleCreate} />
      </ScrollView>
    </SafeAreaView>
  );
}
