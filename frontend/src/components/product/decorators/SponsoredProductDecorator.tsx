import type { ReactNode } from "react";
import { Text, View } from "react-native";

export interface ProductDecoratorProps {
  children: ReactNode;
}

// Decorator pattern: wraps a base product card to add a "Patrocinado" ribbon
// without modifying the wrapped component. Decorators are stackable per screen.
export function SponsoredProductDecorator({ children }: ProductDecoratorProps) {
  return (
    <View className="relative">
      {children}
      <View className="absolute right-2 top-2 rounded-full bg-secondary px-2 py-0.5">
        <Text className="font-heading text-[9px] uppercase text-white">Patrocinado</Text>
      </View>
    </View>
  );
}
