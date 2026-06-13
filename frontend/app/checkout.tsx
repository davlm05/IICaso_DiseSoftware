import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PointsTag } from "../src/components/atoms/PointsTag";
import { QRCodeView } from "../src/components/molecules/QRCodeView";
import { useSessionStore } from "../src/store/sessionStore";

/**
 * QRValidationScreen (README §1.2 — `/app/checkout.tsx`).
 * Container: calls the checkout hook (socket/poll, README §1.5 operation 4),
 * renders QRCodeView + waiting status. Matches Figma screen 5.
 *
 * In production, "ValidatingState" subscribes to socket.io room
 * `session:{id}` with a 3s polling fallback until the POS confirms or the
 * 10-minute QR window expires.
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const store = useSessionStore();
  const qrToken = useSessionStore((s) => s.qrToken);
  const qrFallbackCode = useSessionStore((s) => s.qrFallbackCode);
  const qrExpiresAt = useSessionStore((s) => s.qrExpiresAt);
  const pending = useSessionStore((s) => s.pendingItems);

  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!qrToken) {
      store.generateQr();
    }
  }, []);

  // Stand-in for the socket/poll hook (README §1.5 operation 4):
  // resolves automatically after a short delay to demonstrate the
  // ValidatingState -> ConfirmationScreen transition.
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      store.confirmValidation();
      router.replace("/confirmation");
    }, 4000);
    return () => clearTimeout(timer);
  }, [waiting]);

  const pendingPoints = pending.reduce((sum, p) => sum + p.points, 0);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="items-center gap-1 px-md py-md">
        <Text className="font-display text-lg text-white">Validación de compra</Text>
      </View>

      <View className="flex-1 items-center justify-start gap-md px-md">
        <View className="items-center gap-1 px-lg">
          <Text className="text-center font-display text-xl text-white">
            Muéstrale este código a la cajera
          </Text>
          <Text className="text-center font-body text-xs text-white/85">
            La cajera lo escaneará para validar que compraste los productos patrocinados
          </Text>
        </View>

        {qrToken && qrFallbackCode && qrExpiresAt ? (
          <QRCodeView token={qrToken} fallbackCode={qrFallbackCode} expiresAt={qrExpiresAt} />
        ) : null}

        <View className="w-full flex-row items-center justify-between rounded-2xl border border-white/30 bg-white/10 px-md py-3">
          <Text className="font-heading text-sm text-white">
            {pending.length} producto{pending.length === 1 ? "" : "s"} pendientes de validar
          </Text>
          <PointsTag points={pendingPoints} state="pending" />
        </View>

        <View className="mt-md flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-white" />
          <Text className="font-heading text-sm text-white">Esperando validación de la cajera…</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
