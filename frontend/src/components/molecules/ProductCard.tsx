import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Badge } from "../atoms/Badge";
import { Icon } from "../atoms/Icon";
import { PointsTag } from "../atoms/PointsTag";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  points: number;
  iconName?: string;
}

export interface ProductCardProps {
  product: Product;
  isNew?: boolean;
  onDelete?: (id: string) => void;
}

// Presentational; wrapped in React.memo. Delete dispatches RemoveProductCommand
// (undo supported) in the feature container.
function ProductCardBase({ product, isNew, onDelete }: ProductCardProps) {
  return (
    <View className={`flex-row items-center gap-3 px-3 py-3 ${isNew ? "bg-success/10" : ""}`}>
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-background">
        <Icon name={(product.iconName as never) ?? "Package"} size={15} color="#5a8a6a" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-heading text-sm text-text-primary">{product.name}</Text>
          {isNew ? <Badge text="Nuevo" tone="new" /> : null}
        </View>
        <Text className="font-body text-xs text-text-secondary">
          {product.brand} · {product.price.toLocaleString()}
        </Text>
      </View>
      <PointsTag points={product.points} state="pending" />
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${product.name}`}
          onPress={() => onDelete(product.id)}
          className="h-7 w-7 items-center justify-center rounded-lg bg-error/10"
        >
          <Icon name="X" size={11} color="#c0392b" />
        </Pressable>
      ) : null}
    </View>
  );
}

export const ProductCard = memo(ProductCardBase);
