import { Modal, Text, View } from "react-native";
import { Button } from "../atoms/Button";
import type { Product } from "./ProductCard";

export interface ScanConfirmationModalProps {
  product: Product | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Error prevention: requires explicit confirmation of the detected product
// before accrual (§1.2 Error Prevention). Focus stays trapped in the modal.
export function ScanConfirmationModal({ product, visible, onConfirm, onCancel }: ScanConfirmationModalProps) {
  return (
    <Modal visible={visible && !!product} transparent animationType="slide" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="gap-3 rounded-t-3xl bg-surface p-6">
          <Text className="font-display text-lg text-text-primary">¿Es este tu producto?</Text>
          {product ? (
            <Text className="font-body text-sm text-text-secondary">
              {product.name} · {product.brand} · +{product.points} pts
            </Text>
          ) : null}
          <Button label="Confirmar producto" variant="primary" onPress={onConfirm} />
          <Button label="Volver a escanear" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}
