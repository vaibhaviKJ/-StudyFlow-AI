import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "current_roadmap_id";

export async function setCurrentRoadmapId(id) {
  try {
    await AsyncStorage.setItem(KEY, String(id));
  } catch (e) {
    // non-fatal — worst case the user has to pick a roadmap again
  }
}

export async function getCurrentRoadmapId() {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value ? parseInt(value, 10) : null;
  } catch (e) {
    return null;
  }
}
