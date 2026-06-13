import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../src/components/atoms/Icon";
import { Input } from "../src/components/atoms/Input";
import { LocationPill } from "../src/components/atoms/LocationPill";
import { Toast } from "../src/components/atoms/Toast";
import { ScanConfirmationModal } from "../src/components/molecules/ScanConfirmationModal";
import { useScan } from "../src/hooks/useScan";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "cam", "0", "del"];

/**
 * ScanScreen (README §1.2 — `/app/scan.tsx`, "Container: calls useScan
 * (Strategy: camera/manual), mounts the camera, renders
 * ScanConfirmationModal").
 *
 * Single route covering both Figma screens 2 ("Apunta al código de barras")
 * and 2B ("Ingreso manual de código"). The active capture method is the
 * Strategy held by `useScan` — switching modes only swaps the input source;
 * validation (CoR chain) and confirmation (ScanConfirmationModal) are shared.
 */
export default function ScanScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const scan = useScan();

  const handleConfirm = () => {
    scan.confirm();
    router.back();
  };

  return scan.mode === "camera" ? (
    <CameraMode
      permission={permission}
      requestPermission={requestPermission}
      isFocused={isFocused}
      scan={scan}
      onClose={() => router.back()}
      onConfirm={handleConfirm}
    />
  ) : (
    <ManualMode scan={scan} onConfirm={handleConfirm} />
  );
}

function CameraMode({
  permission,
  requestPermission,
  isFocused,
  scan,
  onClose,
  onConfirm,
}: {
  permission: { granted: boolean } | null;
  requestPermission: () => void;
  isFocused: boolean;
  scan: ReturnType<typeof useScan>;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#1a2a1a] p-lg">
        <Text className="text-center font-heading text-base text-white">
          Necesitamos acceso a la cámara para escanear productos
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          className="rounded-2xl bg-primary px-6 py-3"
        >
          <Text className="font-heading text-sm text-white">Permitir cámara</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a2a1a]" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-md py-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
        >
          <Icon name="X" size={16} color="#FFFFFF" />
        </Pressable>
        <Text className="font-heading text-base text-white">Escanear producto</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Linterna"
          className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
        >
          <Icon name="Zap" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center">
        {isFocused ? (
          <CameraView
            style={{ flex: 1, width: "100%" }}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
            onBarcodeScanned={({ data }) => scan.submit(data)}
          />
        ) : null}

        <View className="absolute top-10 rounded-full bg-black/60 px-4 py-2">
          <Text className="font-heading text-xs text-white">Apunta al código de barras</Text>
        </View>

        {scan.rejection ? (
          <View className="absolute bottom-28 w-[90%]">
            <Toast message={scan.rejection} tone="error" visible onDismiss={scan.dismissRejection} />
          </View>
        ) : null}
      </View>

      <View className="gap-2 p-md">
        <LocationPill storeName={scan.storeName} verified={scan.locationVerified} />
        <Pressable
          accessibilityRole="button"
          onPress={() => scan.setMode("manual")}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-white/10 px-md py-4"
        >
          <Icon name="Keyboard" size={16} color="#FFFFFF" />
          <Text className="font-heading text-sm text-white">Ingresar código manualmente</Text>
        </Pressable>
      </View>

      <ScanConfirmationModal
        product={scan.scanned}
        visible={!!scan.scanned}
        onConfirm={onConfirm}
        onCancel={scan.cancel}
      />
    </SafeAreaView>
  );
}

function ManualMode({ scan, onConfirm }: { scan: ReturnType<typeof useScan>; onConfirm: () => void }) {
  const [code, setCode] = useState("");

  const pressKey = (key: string) => {
    if (key === "del") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (key === "cam") {
      scan.setMode("camera");
      return;
    }
    if (code.length >= 13) return;
    setCode((c) => c + key);
  };

  const handleSubmit = () => {
    scan.submit(code);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-background bg-surface px-md py-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la cámara"
          onPress={() => scan.setMode("camera")}
          className="h-9 w-9 items-center justify-center rounded-full bg-success/20"
        >
          <Icon name="ArrowLeft" size={16} color="#15803D" />
        </Pressable>
        <Text className="font-display text-base text-text-primary">Ingresar código manual</Text>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-md">
        {scan.rejection ? (
          <Toast message={scan.rejection} tone="error" visible onDismiss={scan.dismissRejection} />
        ) : null}

        <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-md">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-success/20">
            <Icon name="Keyboard" size={20} color="#15803D" decorative={false} />
          </View>
          <View className="flex-1">
            <Text className="font-heading text-sm text-text-primary">Código de barras</Text>
            <Text className="font-body text-xs text-text-secondary">
              Ingresa los 13 dígitos que aparecen debajo del código del producto
            </Text>
          </View>
        </View>

        <LocationPill storeName={scan.storeName} verified={scan.locationVerified} />

        <Text className="font-heading text-[11px] uppercase tracking-wide text-text-secondary">
          Código de barras (EAN-13)
        </Text>

        <Input value={code} editable={false} placeholder="0000000000000" />

        <Text className="font-body text-xs text-text-secondary">{code.length} / 13 dígitos ingresados</Text>

        <View className="flex-row gap-2 rounded-2xl border border-success/40 bg-success/10 p-md">
          <Icon name="Info" size={14} color="#15803D" decorative={false} />
          <View className="flex-1">
            <Text className="font-heading text-xs text-secondary">¿Dónde encuentro el código?</Text>
            <Text className="font-body text-xs text-text-secondary">
              Es la secuencia de números que aparece debajo de las líneas negras del código de barras del producto.
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {KEYS.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === "del" ? "Borrar" : key === "cam" ? "Usar cámara" : key}
              onPress={() => pressKey(key)}
              className={`h-16 w-[31%] items-center justify-center rounded-2xl ${
                key === "del" ? "bg-error/10" : key === "cam" ? "bg-success/10" : "bg-surface"
              }`}
            >
              {key === "del" ? (
                <Icon name="Delete" size={18} color="#DC2626" decorative={false} />
              ) : key === "cam" ? (
                <Icon name="Camera" size={18} color="#15803D" decorative={false} />
              ) : (
                <Text className="font-display text-lg text-text-primary">{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="p-md">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar producto"
          disabled={code.length < 8}
          onPress={handleSubmit}
          className={`items-center rounded-2xl py-4 ${code.length < 8 ? "bg-primary/40" : "bg-primary"}`}
        >
          <Text className="font-heading text-base text-white">Buscar producto</Text>
        </Pressable>
      </View>

      <ScanConfirmationModal
        product={scan.scanned}
        visible={!!scan.scanned}
        onConfirm={onConfirm}
        onCancel={scan.cancel}
      />
    </SafeAreaView>
  );
}
