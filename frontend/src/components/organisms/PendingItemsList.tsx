import { Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ProductCard, type Product } from "../molecules/ProductCard";

export interface PendingItemsListProps {
  items: Product[];
  newestId?: string;
  onDelete?: (id: string) => void;
}

// Virtualized with FlashList; empty list renders the dashed empty-state card.
export function PendingItemsList({ items, newestId, onDelete }: PendingItemsListProps) {
  if (items.length === 0) {
    return (
      <View className="items-center gap-2 rounded-2xl border border-dashed border-background p-8">
        <Text className="font-heading text-sm text-text-primary">Aún no has escaneado nada</Text>
        <Text className="text-center font-body text-xs text-text-secondary">
          Escanea productos patrocinados para ir acumulando puntos pendientes
        </Text>
      </View>
    );
  }
  return (
    <View className="overflow-hidden rounded-2xl border border-background bg-surface">
      <FlashList
        data={items}
        estimatedItemSize={64}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductCard product={item} isNew={item.id === newestId} onDelete={onDelete} />
        )}
      />
    </View>
  );
}
