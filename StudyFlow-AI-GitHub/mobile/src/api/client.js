import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Set EXPO_PUBLIC_API_URL in mobile/.env for a physical phone, for example
// EXPO_PUBLIC_API_URL=http://192.168.1.5:8000. Emulator defaults stay local.
const emulatorHost = Platform.select({
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000",
});
const configuredHost = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = configuredHost || emulatorHost;

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function saveToken(token) {
  await AsyncStorage.setItem("token", token);
}

export async function clearToken() {
  await AsyncStorage.removeItem("token");
}

export default client;
