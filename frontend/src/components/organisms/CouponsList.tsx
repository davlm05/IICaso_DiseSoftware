import { Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Icon } from "../atoms/Icon";

export interface Coupon {
  id: string;
  name: string;
  code: string;
  expiresAt?: string;
}

export interface CouponsListProps {
  coupons: Coupon[];
}

// Virtualized list of already-redeemed coupons ready to use.
export function CouponsList({ coupons }: CouponsListProps) {
  if (coupons.length === 0) {
    return (
      <View className="items-center rounded-2xl border border-dashed border-background p-8">
        <Text className="font-body text-xs text-text-secondary">Aún no tienes cupones canjeados</Text>
      </View>
    );
  }
  return (
    <View className="overflow-hidden rounded-2xl border border-background bg-surface">
      <FlashList
        data={coupons}
        estimatedItemSize={64}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 px-3 py-3">
            <Icon name="Ticket" size={20} color="#16A34A" />
            <View className="flex-1">
              <Text className="font-heading text-sm text-text-primary">{item.name}</Text>
              <Text className="font-mono text-xs text-text-secondary">{item.code}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
