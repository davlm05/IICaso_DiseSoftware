import { Pressable, Text, View } from "react-native";
import { Icon } from "../atoms/Icon";

type Tab = "home" | "scan" | "rewards" | "profile";

export interface BottomNavProps {
  active: Tab;
  onNavigate?: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string; icon: "House" | "Barcode" | "Gift" | "User" }[] = [
  { key: "home", label: "Inicio", icon: "House" },
  { key: "scan", label: "Escanear", icon: "Barcode" },
  { key: "rewards", label: "Recompensas", icon: "Gift" },
  { key: "profile", label: "Perfil", icon: "User" },
];

// Navigation via Expo Router in the container; each tab is a11y role "tab".
export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <View className="flex-row justify-around border-t border-background bg-surface pb-3 pt-2">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => onNavigate?.(t.key)}
            className="items-center gap-1"
          >
            <Icon name={t.icon} size={19} color={on ? "#16A34A" : "#b4c0b4"} />
            <Text className={`text-[10px] ${on ? "font-heading text-secondary" : "font-body text-text-secondary"}`}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
