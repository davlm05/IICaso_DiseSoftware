import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../src/components/atoms/Icon";
import { Pressable } from "react-native";
import { RewardsCatalog } from "../src/components/organisms/RewardsCatalog";
import { BottomNav } from "../src/components/organisms/BottomNav";
import { COUPONS, REWARDS } from "../src/features/catalog/mockCatalog";
import { RedeemCouponCommand } from "../src/features/session/commands/sessionCommands";
import { useSessionStore } from "../src/store/sessionStore";

/**
 * RewardsScreen (README §1.2 — `/app/rewards.tsx`).
 * Container: calls useRewards-equivalent state, composes RewardsCatalog.
 * Matches Figma screen 7 — "Mis recompensas".
 */
export default function RewardsScreen() {
  const router = useRouter();
  const store = useSessionStore();
  const balance = useSessionStore((s) => s.creditedPoints);

  const highlighted = REWARDS.find((r) => r.highlighted);
  const rest = REWARDS.filter((r) => !r.highlighted);

  const handleRedeem = (id: string) => {
    const reward = REWARDS.find((r) => r.id === id);
    if (!reward) return;
    new RedeemCouponCommand(store, reward.cost).execute();
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
        <Text className="font-display text-base text-text-primary">Mis recompensas</Text>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-md">
        <View className="flex-row items-center justify-between rounded-3xl bg-primary p-md">
          <View>
            <Text className="font-heading text-[10px] uppercase tracking-wide text-white/80">
              Tus puntos disponibles
            </Text>
            <Text className="font-display text-4xl text-white">{balance}</Text>
            <Text className="font-body text-xs text-white/80">Listos para canjear</Text>
          </View>
          <Icon name="Star" size={40} color="#FFFFFF" decorative={false} />
        </View>

        {highlighted ? (
          <View>
            <Text className="mb-2 font-heading text-[11px] uppercase tracking-wide text-text-secondary">
              Recomendado para ti
            </Text>
            <View className="gap-2 rounded-3xl bg-secondary p-md">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Icon name="Percent" size={22} color="#FFFFFF" decorative={false} />
                </View>
                <View className="flex-1">
                  <Text className="font-heading text-[10px] uppercase text-white/80">Disponible ahora</Text>
                  <Text className="font-display text-base text-white">{highlighted.name}</Text>
                  <Text className="font-body text-xs text-white/80">{highlighted.description}</Text>
                </View>
              </View>
              <View className="self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="font-heading text-xs text-white">{highlighted.cost} pts</Text>
              </View>
            </View>
          </View>
        ) : null}

        <Text className="font-heading text-[11px] uppercase tracking-wide text-text-secondary">
          Más recompensas
        </Text>

        <RewardsCatalog rewards={rest} coupons={COUPONS} balance={balance} onRedeem={handleRedeem} />
      </ScrollView>

      <BottomNav
        active="rewards"
        onNavigate={(tab) => {
          if (tab === "home") router.replace("/");
          if (tab === "scan") router.push("/scan");
          if (tab === "profile") router.push("/profile");
        }}
      />
    </SafeAreaView>
  );
}
