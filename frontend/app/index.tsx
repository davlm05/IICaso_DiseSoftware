import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { Icon } from "../src/components/atoms/Icon";
import { LocationPill } from "../src/components/atoms/LocationPill";
import { Toast } from "../src/components/atoms/Toast";
import { PointsCard } from "../src/components/molecules/PointsCard";
import { BottomNav } from "../src/components/organisms/BottomNav";
import { PendingItemsList } from "../src/components/organisms/PendingItemsList";
import { SponsoredCarousel } from "../src/components/organisms/SponsoredCarousel";
import { SPONSORED_PRODUCTS } from "../src/features/catalog/mockCatalog";
import { RemoveProductCommand } from "../src/features/session/commands/sessionCommands";
import { useAuthStore } from "../src/store/authStore";
import { useSessionStore } from "../src/store/sessionStore";

/**
 * LobbyScreen (README §1.2 Templates / Screens — `/app/index.tsx`).
 * Container: composes PointsCard + SponsoredCarousel + PendingItemsList + BottomNav.
 * Matches wireframes 1, 3, 4 (empty / 1 product / 3 products).
 */
export default function LobbyScreen() {
  const router = useRouter();
  const store = useSessionStore();
  const pending = useSessionStore((s) => s.pendingItems);
  const lastAddedId = useSessionStore((s) => s.lastAddedId);
  const creditedPoints = useSessionStore((s) => s.creditedPoints);
  const nextRewardAt = useSessionStore((s) => s.nextRewardAt);
  const storeName = useSessionStore((s) => s.storeName);
  const locationVerified = useSessionStore((s) => s.locationVerified);

  const authStatus = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [toastVisible, setToastVisible] = useState(false);

  // Auth gate + session/balance bootstrap. Once the initial token check has
  // run, redirect anonymous users to /login; otherwise ensure an active
  // session (GET /sessions/active → POST /sessions) and load the balance.
  useEffect(() => {
    if (!hydrated) return;
    if (authStatus !== "AUTHENTICATED") {
      router.replace("/login");
      return;
    }
    void store.ensureSession();
    void store.refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authStatus]);

  const lastAdded = pending.find((p) => p.id === lastAddedId);
  const pendingPoints = store.pendingPoints();
  const hasItems = pending.length > 0;

  const handleDelete = (id: string) => {
    const product = pending.find((p) => p.id === id);
    if (!product) return;
    new RemoveProductCommand(store, product).execute();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-background bg-surface px-md py-sm">
        <Text className="font-display text-lg text-text-primary">
          Smart<Text className="text-primary">Cart</Text>
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-success/20">
          <Text className="font-heading text-xs text-secondary">JC</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-md">
        {lastAdded ? (
          <Toast
            message={`${lastAdded.name} agregado · +${lastAdded.points} pts pendientes`}
            tone="success"
            visible={true}
          />
        ) : null}

        <LocationPill storeName={storeName} verified={locationVerified} />

        <PointsCard total={creditedPoints} pending={pendingPoints} nextRewardAt={nextRewardAt} />

        {hasItems ? (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Escanear otro"
                variant="secondary"
                icon={<Icon name="Barcode" size={16} color="#15803D" />}
                onPress={() => router.push("/scan")}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Generar QR de salida"
                variant="primary"
                icon={<Icon name="QrCode" size={16} color="#FFFFFF" />}
                onPress={() => router.push("/checkout")}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Escanear producto"
            variant="primary"
            icon={<Icon name="Barcode" size={20} color="#FFFFFF" />}
            onPress={() => router.push("/scan")}
          />
        )}

        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-xs uppercase tracking-wide text-text-secondary">
            Productos escaneados
          </Text>
          <View className="rounded-full bg-success/20 px-2 py-0.5">
            <Text className="font-heading text-[10px] text-secondary">
              {pending.length} producto{pending.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <PendingItemsList items={pending} newestId={lastAddedId ?? undefined} onDelete={handleDelete} />

        <SponsoredCarousel products={SPONSORED_PRODUCTS} visibleByDefault={3} />
      </ScrollView>

      <BottomNav
        active="home"
        onNavigate={(tab) => {
          if (tab === "scan") router.push("/scan");
          if (tab === "rewards") router.push("/rewards");
          if (tab === "profile") router.push("/profile");
        }}
      />
    </SafeAreaView>
  );
}
