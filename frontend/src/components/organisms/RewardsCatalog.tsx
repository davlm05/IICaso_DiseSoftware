import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { RewardCard, type Reward } from "../molecules/RewardCard";
import { CouponsList, type Coupon } from "./CouponsList";

export interface RewardsCatalogProps {
  rewards: Reward[];
  coupons: Coupon[];
  balance: number;
  onRedeem?: (id: string) => void;
}

type TabKey = "available" | "coupons";

// Tabs ("Disponibles" / "Mis cupones") wrapping RewardCard list and CouponsList.
export function RewardsCatalog({ rewards, coupons, balance, onRedeem }: RewardsCatalogProps) {
  const [tab, setTab] = useState<TabKey>("available");
  return (
    <View className="gap-3">
      <View className="flex-row gap-1 rounded-2xl border border-background bg-surface p-1">
        {(["available", "coupons"] as TabKey[]).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === k }}
            onPress={() => setTab(k)}
            className={`flex-1 items-center rounded-xl py-2 ${tab === k ? "bg-primary" : ""}`}
          >
            <Text className={`font-heading text-sm ${tab === k ? "text-white" : "text-text-secondary"}`}>
              {k === "available" ? "Disponibles" : "Mis cupones"}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "available" ? (
        <View className="overflow-hidden rounded-2xl border border-background bg-surface">
          <FlashList
            data={rewards}
            estimatedItemSize={88}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <RewardCard reward={item} balance={balance} onRedeem={onRedeem} />}
          />
        </View>
      ) : (
        <CouponsList coupons={coupons} />
      )}
    </View>
  );
}
