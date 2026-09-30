// NOTE: expo-notifications' Android functionality was removed from Expo Go
// starting SDK 53 — it only works in a custom development build, not in the
// Expo Go app. Since this project is set up to run in Expo Go for quick
// testing, this feature is disabled here rather than crashing on load.
// To re-enable it: build a development build with `eas build --profile
// development`, add expo-notifications back to package.json, and restore
// the real implementation (kept below in comments for reference).

export async function isReminderEnabled() {
  return false;
}

export async function enableDailyReminder() {
  return { ok: false, reason: "not_supported_in_expo_go" };
}

export async function disableDailyReminder() {
  return;
}

/* --- Real implementation, for use once you have a development build ---

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const FLAG_KEY = "daily_reminder_enabled";
const NOTIFICATION_ID_KEY = "daily_reminder_notification_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function isReminderEnabled() {
  const value = await AsyncStorage.getItem(FLAG_KEY);
  return value === "true";
}

export async function enableDailyReminder() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, reason: "permission_denied" };
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Study reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Keep your streak alive 🔥",
      body: "You haven't studied today yet — a quick lesson takes 5 minutes.",
    },
    trigger: { hour: 19, minute: 0, repeats: true },
  });
  await AsyncStorage.setItem(FLAG_KEY, "true");
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  return { ok: true };
}

export async function disableDailyReminder() {
  const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {}
  }
  await AsyncStorage.setItem(FLAG_KEY, "false");
}

*/
