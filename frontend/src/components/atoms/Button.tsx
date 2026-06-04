import type { ReactNode } from "react";
import { Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  icon?: ReactNode;
}

const base = "flex-row items-center justify-center gap-2 rounded-2xl px-md py-4";

// `variant` is the single source of the primary-vs-secondary CTA hierarchy
// (usability Finding #1): primary dominates, secondary/ghost recede.
const container: Record<Variant, string> = {
  primary: "bg-primary shadow-lg",
  secondary: "border border-secondary bg-transparent",
  ghost: "bg-transparent",
};
const text: Record<Variant, string> = {
  primary: "text-white font-heading text-base",
  secondary: "text-secondary font-heading text-sm",
  ghost: "text-text-secondary font-body text-sm",
};

export function Button({ label, variant = "primary", icon, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      className={`${base} ${container[variant]} ${disabled ? "opacity-50" : ""}`}
      {...rest}
    >
      {icon}
      <Text className={text[variant]}>{label}</Text>
    </Pressable>
  );
}
