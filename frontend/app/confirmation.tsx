import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { Icon } from "../src/components/atoms/Icon";
import { PointsTag } from "../src/components/atoms/PointsTag";
import { ValidatedProductDecorator } from "../src/components/product/decorators/ValidatedProductDecorator";
import { useSessionStore } from "../src/store/sessionStore";

/**
 * ConfirmationScreen (README §1.2 — `/app/confirmation.tsx`).
 * Container: renders the credited-points hero, validated list (wrapped in
 * ValidatedProductDecorator), new total, and home/rewards CTAs.
 * Matches Figma screen 6 — "Puntos acreditados".
 */
export default function ConfirmationScreen() {
  const router = useRouter();
  const store = useSessionStore();
  const pending = useSessionStore((s) => s.pendingItems);
  const creditedPoints = useSessionStore((s) => s.creditedPoints);
  const nextRewardAt = useSessionStore((s) => s.nextRewardAt);

  const totalAwarded = pending.reduce((sum, p) => sum + p.points, 0);
  const totalSpend = pending.reduce((sum, p) => sum + p.price, 0);
  const remaining = Math.max(nextRewardAt - creditedPoints, 0);
  const progress = Math.min((creditedPoints / nextRewardAt) * 100, 100);

  const handleHome = () => {
    store.reset();
    router.replace("/");
  };

  const handleRewards = () => {
    router.push("/rewards");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="items-center border-b border-background bg-surface px-md py-sm">
        <Text className="font-display text-lg text-text-primary">Compra validada</Text>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-md">
        <View className="items-center gap-2 rounded-3xl bg-primary p-lg">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white/25">
            <Icon name="Check" size={32} color="#FFFFFF" decorative={false} />
          </View>
          <Text className="font-display text-lg text-white">Puntos acreditados</Text>
          <Text className="font-body text-xs text-white/85">Tu compra fue verificada en caja</Text>
        </View>

        <View className="gap-2 rounded-3xl bg-surface p-md">
          <View className="flex-row items-center gap-3">
            <Text className="font-display text-3xl text-primary">+{totalAwarded}</Text>
            <View className="flex-1">
              <Text className="font-heading text-[10px] uppercase tracking-wide text-text-secondary">
                Puntos ganados hoy
              </Text>
              <Text className="font-heading text-sm text-text-primary">Total: {creditedPoints} pts</Text>
            </View>
            <Icon name="Star" size={24} color="#FACC15" decorative={false} />
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-background">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
          <Text className="font-body text-[10px] text-text-secondary">
            Te faltan {remaining} pts para tu descuento
          </Text>
        </View>

        <Text className="font-heading text-[11px] uppercase tracking-wide text-text-secondary">
          Productos validados
        </Text>

        <View className="gap-2 rounded-2xl border border-background bg-surface p-md">
          {pending.map((item) => (
            <ValidatedProductDecorator key={item.id}>
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-background">
                  <Icon name={(item.iconName as never) ?? "Package"} size={15} color="#5a8a6a" />
                </View>
                <Text className="flex-1 font-heading text-sm text-text-primary">{item.name}</Text>
                <PointsTag points={item.points} state="credited" />
              </View>
            </ValidatedProductDecorator>
          ))}
        </View>

        <View className="flex-row items-center justify-between rounded-2xl border border-background bg-surface px-md py-3">
          <Text className="font-body text-xs text-text-secondary">Total comprado en patrocinados</Text>
          <Text className="font-heading text-base text-text-primary">{totalSpend.toLocaleString()}</Text>
        </View>

        <Button
          label="Volver al inicio"
          variant="primary"
          icon={<Icon name="Home" size={16} color="#FFFFFF" />}
          onPress={handleHome}
        />
        <Button
          label="Ver mis recompensas"
          variant="secondary"
          icon={<Icon name="Gift" size={16} color="#15803D" />}
          onPress={handleRewards}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
