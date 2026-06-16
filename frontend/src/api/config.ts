import { Platform } from "react-native";

/**
 * API base URL (README §1.3 / §2.4). Resolved from `EXPO_PUBLIC_API_URL` when
 * set, otherwise a platform-aware localhost default so the app talks to the
 * NestJS API mounted at `/api/v1`.
 *
 * - iOS simulator / web:      http://localhost:3000/api/v1
 * - Android emulator:         http://10.0.2.2:3000/api/v1  (localhost ≠ host)
 * - Physical device (Expo Go) set EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000/api/v1
 */
function defaultBaseUrl(): string {
  if (Platform.OS === "android") return "http://10.0.2.2:3000/api/v1";
  return "http://localhost:3000/api/v1";
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl();

/** Seeded demo store (no GET /stores endpoint in the MVP — see CLAUDE.md). */
export const DEFAULT_STORE_ID = "11111111-1111-4111-8111-111111111111";
