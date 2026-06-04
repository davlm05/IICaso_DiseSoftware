import { Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "../atoms/Icon";
import { PointsTag } from "../atoms/PointsTag";
import type { Product } from "../molecules/ProductCard";

export interface SponsoredCarouselProps {
  products: Product[];
  visibleByDefault?: number;
  onSeeAll?: () => void;
}

// Progressive disclosure (usability Finding #3): show a subset by default and
// reveal the rest behind a "Ver todos" affordance to lower lobby density.
export function SponsoredCarousel({ products, visibleByDefault = 4, onSeeAll }: SponsoredCarouselProps) {
  const shown = products.slice(0, visibleByDefault);
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-xs uppercase tracking-wide text-text-secondary">
          Productos con puntos hoy
        </Text>
        {products.length > visibleByDefault ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Ver todos los productos" onPress={onSeeAll}>
            <Text className="font-heading text-xs text-primary">Ver todos</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
        {shown.map((p) => (
          <View key={p.id} className="w-36 gap-1.5 rounded-2xl border border-background bg-surface p-3">
            <View className="self-end">
              <PointsTag points={p.points} state="pending" />
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-background">
              <Icon name={(p.iconName as never) ?? "Package"} size={22} color="#5a8a6a" />
            </View>
            <Text className="font-heading text-xs text-text-primary">{p.name}</Text>
            <Text className="font-body text-[10px] text-text-secondary">{p.brand}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
