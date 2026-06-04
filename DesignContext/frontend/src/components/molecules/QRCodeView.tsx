import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Icon } from "../atoms/Icon";

export interface QRCodeViewProps {
  token: string;
  fallbackCode: string;
  /** Expiry timestamp in epoch milliseconds (10-minute checkout window). */
  expiresAt: number;
}

function format(ms: number) {
  const s = Math.max(Math.floor(ms / 1000), 0);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Wraps react-native-qrcode-svg; renders the alphanumeric fallback + countdown.
export function QRCodeView({ token, fallbackCode, expiresAt }: QRCodeViewProps) {
  const [remaining, setRemaining] = useState(expiresAt - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(expiresAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <View className="items-center gap-3 rounded-3xl bg-surface p-5">
      <QRCode value={token} size={200} />
      <Text className="font-mono text-xs tracking-wider text-text-secondary">{fallbackCode}</Text>
      <View className="flex-row items-center gap-1">
        <Icon name="Clock" size={11} color="#16A34A" />
        <Text className="font-heading text-xs text-primary">Válido por {format(remaining)}</Text>
      </View>
    </View>
  );
}
