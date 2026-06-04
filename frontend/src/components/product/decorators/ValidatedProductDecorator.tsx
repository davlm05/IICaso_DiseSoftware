import type { ReactNode } from "react";
import { View } from "react-native";
import { Icon } from "../../atoms/Icon";

export interface ProductDecoratorProps {
  children: ReactNode;
}

// Adds the green check shown on products validated at the POS (confirmation screen).
export function ValidatedProductDecorator({ children }: ProductDecoratorProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-6 w-6 items-center justify-center rounded-full border border-primary bg-success/10">
        <Icon name="Check" size={11} color="#16A34A" />
      </View>
      <View className="flex-1">{children}</View>
    </View>
  );
}
