import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { Icon } from "../src/components/atoms/Icon";
import { Input } from "../src/components/atoms/Input";
import { Toast } from "../src/components/atoms/Toast";
import { BottomNav } from "../src/components/organisms/BottomNav";
import { ROLES } from "../src/types";
import { useAuthStore } from "../src/store/authStore";

/**
 * EditUserScreen (PATCH /users/me — README §1.3 §"Key endpoints":
 * "Update profile (name, phone)", extended here to also surface email,
 * password, and role per this task's requirements).
 *
 * Reached from BottomNav's "Perfil" tab. Fields shown: email, fullName,
 * password, phone, role.
 *
 * Role editing is restricted to SUPER_ADMIN (README §1.3 RBAC table:
 * "SUPER_ADMIN ... User & role management ... Full back-office authority").
 * For any other role, the role field is rendered read-only and the
 * "Crear usuario" action is hidden — this UI-side gate mirrors the
 * server-side check that will live in `RolesGuard` + `@Roles(SUPER_ADMIN)`
 * once the backend exists.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "USER");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background p-lg">
        <Text className="text-center font-heading text-base text-text-primary">
          Inicia sesión para ver tu perfil.
        </Text>
        <View className="mt-3">
          <Button label="Ir a iniciar sesión" variant="primary" onPress={() => router.replace("/login")} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    updateUser({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      // Only sent if the user typed a new password.
      ...(password ? { password } : {}),
      // role only changes if the user is SUPER_ADMIN; otherwise we keep
      // the original value regardless of local state.
      role: isSuperAdmin ? role : user.role,
    });
    setPassword("");
    setSaved(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-background bg-surface px-md py-sm">
        <Text className="font-display text-base text-text-primary">Editar perfil</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={handleLogout}
          className="h-9 w-9 items-center justify-center rounded-full bg-error/10"
        >
          <Icon name="LogOut" size={16} color="#DC2626" decorative={false} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-md">
        {saved ? (
          <Toast message="Perfil actualizado." tone="success" visible onDismiss={() => setSaved(false)} />
        ) : null}

        <Input label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" />

        <Input label="Nombre completo" value={fullName} onChangeText={setFullName} />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Dejar en blanco para no cambiar"
        />

        <Input label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <View className="gap-1">
          <Text className="font-body text-xs uppercase tracking-wide text-text-secondary">Rol</Text>

          {isSuperAdmin ? (
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
          ) : (
            <View className="rounded-2xl border border-background bg-surface px-md py-4">
              <Text className="font-body text-base text-text-secondary">{user.role}</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2 rounded-2xl border border-success/40 bg-success/10 p-md">
          <Icon name="Info" size={14} color="#15803D" decorative={false} />
          <Text className="flex-1 font-body text-xs text-text-secondary">
            Solo los usuarios con rol <Text className="font-heading text-secondary">SUPER_ADMIN</Text> pueden
            editar el rol de un usuario o crear nuevos usuarios. Esta restricción se valida también en el backend
            (RolesGuard) cuando esté disponible.
          </Text>
        </View>

        <Button label="Guardar cambios" variant="primary" onPress={handleSave} />

        {isSuperAdmin ? (
          <Button
            label="Crear usuario"
            variant="secondary"
            icon={<Icon name="UserPlus" size={16} color="#15803D" />}
            onPress={() => router.push("/create-user")}
          />
        ) : null}
      </ScrollView>

      <BottomNav
        active="profile"
        onNavigate={(tab) => {
          if (tab === "home") router.replace("/");
          if (tab === "scan") router.push("/scan");
          if (tab === "rewards") router.push("/rewards");
        }}
      />
    </SafeAreaView>
  );
}
