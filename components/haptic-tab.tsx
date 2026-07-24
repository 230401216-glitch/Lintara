import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";

export function HapticTab({
  onPressIn,
  ref: _ref,
  ...props
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === "ios") {
          void Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light
          );
        }

        onPressIn?.(ev);
      }}
    />
  );
}