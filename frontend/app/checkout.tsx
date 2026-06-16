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

  const [error, setError] = useState<string | null>(null);

  // Request the exit QR once (POST /sessions/:id/qr → ACTIVE → PENDING_CHECKOUT).
  useEffect(() => {
    if (!qrToken) {
      store.generateQr().catch(() => setError("No pudimos generar el código QR."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling (README §1.5 operation 4 — no WebSocket in the MVP, see CLAUDE.md).
  // The POS validates externally (cashier / curl with the POS API key); we poll
  // GET /sessions/:id every 3s until it flips to COMPLETED, then route on.
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      try {
        const status = await store.pollStatus();
        if (!active) return;
        if (status === "COMPLETED") {
          clearInterval(interval);
          await store.confirmValidation();
          router.replace("/confirmation");
        } else if (status === "VALIDATION_FAILED") {
          clearInterval(interval);
          setError("La validación falló. Vuelve a generar el código.");
        } else if (status === "EXPIRED") {
          clearInterval(interval);
          setError("El código expiró. Genera uno nuevo.");
        }
      } catch {
        // Transient network error — keep polling.
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {error ? (
          <View className="mt-md w-full rounded-2xl border border-white/40 bg-white/15 px-md py-3">
            <Text className="text-center font-heading text-sm text-white">{error}</Text>
          </View>
        ) : (
          <View className="mt-md flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-white" />
            <Text className="font-heading text-sm text-white">Esperando validación de la cajera…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
