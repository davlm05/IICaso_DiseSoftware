import { useEffect } from "react";
import { Text, View } from "react-native";
import { Icon } from "./Icon";

type Tone = "success" | "warning" | "error";

export interface ToastProps {
  message: string;
  tone?: Tone;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

const toneMap: Record<Tone, { bg: string; icon: "Check" | "TriangleAlert" | "X"; color: string }> = {
  success: { bg: "border-success bg-success/10", icon: "Check", color: "#0a4a30" },
  warning: { bg: "border-accent bg-accent/10", icon: "TriangleAlert", color: "#7a5800" },
  error: { bg: "border-error bg-error/10", icon: "X", color: "#c0392b" },
};

// Driven (via props) by the global notification slice (Observer); auto-dismisses.
export function Toast({ message, tone = "success", visible, onDismiss, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!visible || !onDismiss) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, onDismiss, duration]);

  if (!visible) return null;
  const cfg = toneMap[tone];
  return (
    <View
      accessibilityLiveRegion="polite"
      className={`flex-row items-center gap-2 rounded-xl border px-3 py-2 ${cfg.bg}`}
    >
      <Icon name={cfg.icon} size={14} color={cfg.color} />
      <Text className="flex-1 font-body text-xs" style={{ color: cfg.color }}>
        {message}
      </Text>
    </View>
  );
}
