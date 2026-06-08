import { Text, View } from "react-native";
import { Icon } from "./Icon";

export interface PointsTagProps {
  points: number;
  state?: "pending" | "credited";
}

// Color AND icon convey state — never color alone (WCAG 2.1 AA, §1.2 Accessibility).
export function PointsTag({ points, state = "pending" }: PointsTagProps) {
  const isPending = state === "pending";
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${points} puntos ${isPending ? "pendientes" : "acreditados"}`}
      className={`flex-row items-center gap-1 rounded-xl px-2 py-1 ${isPending ? "bg-accent/20" : "bg-success/20"}`}
    >
      <Icon name={isPending ? "Clock" : "Check"} size={11} color={isPending ? "#7a5800" : "#0d6e48"} />
      <Text className={`font-heading text-xs ${isPending ? "text-[#7a5800]" : "text-[#0d6e48]"}`}>
        +{points} pts
      </Text>
    </View>
  );
}
