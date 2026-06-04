import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Icon } from "../../atoms/Icon";

export interface LockedRewardDecoratorProps {
  children: ReactNode;
  deficit: number;
}

// Dims a reward and overlays the point deficit when it is out of reach.
export function LockedRewardDecorator({ children, deficit }: LockedRewardDecoratorProps) {
  return (
    <View className="relative opacity-60">
      {children}
      <View className="absolute inset-0 items-center justify-center">
        <View className="flex-row items-center gap-1 rounded-xl bg-background px-3 py-1.5">
          <Icon name="Lock" size={11} color="#a0aaa0" />
          <Text className="font-body text-xs text-text-secondary">Faltan {deficit}</Text>
        </View>
      </View>
    </View>
  );
}
