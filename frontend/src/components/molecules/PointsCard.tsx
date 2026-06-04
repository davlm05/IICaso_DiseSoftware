import { Text, View } from "react-native";

export interface PointsCardProps {
  total: number;
  pending?: number;
  nextRewardAt: number;
}

// Reads `total`/`pending`/`nextRewardAt` from the session store via a selective
// Zustand selector in the container.
export function PointsCard({ total, pending = 0, nextRewardAt }: PointsCardProps) {
  const remaining = Math.max(nextRewardAt - total, 0);
  const progress = Math.min((total / nextRewardAt) * 100, 100);
  return (
    <View className="rounded-3xl bg-primary p-5">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-heading text-xs uppercase tracking-wide text-white/80">Tus puntos</Text>
          <Text className="font-display text-5xl text-white">{total}</Text>
          <Text className="font-body text-xs text-white/80">Te faltan {remaining} para tu descuento</Text>
        </View>
        {pending > 0 ? (
          <View className="items-center rounded-xl bg-white/20 px-3 py-2">
            <Text className="font-display text-xl text-white">+{pending}</Text>
            <Text className="font-heading text-[9px] uppercase text-white/85">Pendientes</Text>
          </View>
        ) : null}
      </View>
      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
        <View className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
      </View>
      <Text className="mt-1 font-body text-[10px] text-white/75">
        {total} / {nextRewardAt} pts para canjear
      </Text>
    </View>
  );
}
