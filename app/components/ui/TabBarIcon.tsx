import React from "react";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * Shared bottom-tab icon: outline glyph when inactive, filled glyph when
 * active — pass the "filled" icon name (e.g. "home"); the outline variant
 * ("home-outline") is derived automatically. Falls back to the given name
 * as-is if no "-outline" variant exists in the icon set.
 */
export const TabBarIcon: React.FC<Props> = ({ name, focused, color, size = 22 }) => {
  const outlineName = `${name}-outline` as keyof typeof Ionicons.glyphMap;
  const iconName = focused ? name : (Ionicons.glyphMap[outlineName] ? outlineName : name);
  return <Ionicons name={iconName} size={size} color={color} />;
};

export default TabBarIcon;
