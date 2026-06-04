import { Text, View } from "react-native";
import { Icon } from "./Icon";

export interface LocationPillProps {
  storeName: string;
  verified: boolean;
}

// Visual gate for point accrual: accrual is enabled only when `verified` is true.
export function LocationPill({ storeName, verified }: LocationPillProps) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={verified ? `Estás en ${storeName}` : "Ubicación no verificada"}
      className={`flex-row items-center gap-2 rounded-xl border bg-surface px-3 py-2 ${
        verified ? "border-success" : "border-error"
      }`}
    >
      <View className={`h-2 w-2 rounded-full ${verified ? "bg-primary" : "bg-error"}`} />
      <Text className="flex-1 font-body text-xs text-text-primary">
        {verified ? "Estás en " : "Acércate a "}
        <Text className="font-heading text-secondary">{storeName}</Text>
      </Text>
      <Icon name="MapPin" size={13} color="#16A34A" decorative={false} />
    </View>
  );
}
