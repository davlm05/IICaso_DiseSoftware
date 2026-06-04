import { Text, TextInput, View, type TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

// Controlled field — driven by React Hook Form `Controller`; renders the Zod
// error message. Used by the manual-barcode fallback and auth forms.
export function Input({ label, error, ...rest }: InputProps) {
  return (
    <View className="gap-1">
      {label ? (
        <Text className="font-body text-xs uppercase tracking-wide text-text-secondary">{label}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#6B7280"
        className={`rounded-2xl border px-md py-4 font-body text-base text-text-primary ${
          error ? "border-error" : "border-primary"
        }`}
        {...rest}
      />
      {error ? <Text className="font-body text-xs text-error">{error}</Text> : null}
    </View>
  );
}
