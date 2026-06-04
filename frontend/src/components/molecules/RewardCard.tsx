import { Text, View } from "react-native";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  expiresInDays?: number;
}

export interface RewardCardProps {
  reward: Reward;
  balance: number;
  onRedeem?: (id: string) => void;
}

// Locked state shows the point deficit; redeem is disabled when balance < cost.
export function RewardCard({ reward, balance, onRedeem }: RewardCardProps) {
  const locked = balance < reward.cost;
  return (
    <View className="flex-row items-center gap-3 px-3 py-3">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Icon name="Gift" size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="font-heading text-sm text-text-primary">{reward.name}</Text>
        <Text className="font-body text-xs text-text-secondary">{reward.description}</Text>
        <Text className="mt-1 font-heading text-xs text-secondary">{reward.cost} pts</Text>
      </View>
      {locked ? (
        <View className="flex-row items-center gap-1 rounded-xl border border-background px-3 py-2">
          <Icon name="Lock" size={10} color="#a0aaa0" />
          <Text className="font-body text-xs text-text-secondary">Faltan {reward.cost - balance}</Text>
        </View>
      ) : (
        <Button label="Canjear" variant="primary" onPress={() => onRedeem?.(reward.id)} />
      )}
    </View>
  );
}
