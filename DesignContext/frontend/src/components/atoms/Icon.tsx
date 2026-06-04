import { icons } from "lucide-react-native";

export interface IconProps {
  name: keyof typeof icons;
  size?: number;
  color?: string;
  /** Decorative icons are hidden from screen readers; pair meaningful icons with text. */
  decorative?: boolean;
}

export function Icon({ name, size = 20, color = "#111827", decorative = true }: IconProps) {
  const LucideIcon = icons[name];
  return (
    <LucideIcon
      size={size}
      color={color}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
    />
  );
}
