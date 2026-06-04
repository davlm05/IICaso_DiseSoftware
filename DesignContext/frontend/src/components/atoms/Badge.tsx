import { Text, View } from "react-native";

export interface BadgeProps {
  text: string;
  tone?: "neutral" | "new";
}

// Renders the "Nuevo" tag on the latest scanned item.
export function Badge({ text, tone = "neutral" }: BadgeProps) {
  const toneClass = tone === "new" ? "bg-primary" : "bg-text-secondary";
  return (
    <View className={`rounded-full px-2 py-0.5 ${toneClass}`}>
      <Text className="font-heading text-[9px] uppercase tracking-wide text-white">{text}</Text>
    </View>
  );
}
