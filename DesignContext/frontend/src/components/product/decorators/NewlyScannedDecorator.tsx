import type { ReactNode } from "react";
import { View } from "react-native";

export interface ProductDecoratorProps {
  children: ReactNode;
}

// Adds the green highlight applied to the most recently scanned item.
export function NewlyScannedDecorator({ children }: ProductDecoratorProps) {
  return <View className="rounded-2xl border-2 border-success bg-success/5">{children}</View>;
}
