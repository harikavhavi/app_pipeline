/**
 * Screen.tsx — Global layout wrapper.
 * - Renders orb backgrounds
 * - Provides ScreenContext so any child Topbar can open the hamburger drawer
 * - Embeds FloatingAIButton and HamburgerMenu on every screen
 */
import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { OrbBackground } from './OrbBackground';
import { HamburgerMenu } from './HamburgerMenu';
import { FloatingAIButton } from './FloatingAIButton';

interface Props {
  children: React.ReactNode;
  hasOrbs?: boolean;
  style?: ViewStyle;
}

/** Context so any child (Topbar, etc.) can open the hamburger menu */
export const ScreenContext = React.createContext<{ openMenu: () => void }>({
  openMenu: () => {},
});

export function useScreenMenu() {
  return React.useContext(ScreenContext);
}

export const Screen: React.FC<Props> = ({ children, hasOrbs = true, style }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ScreenContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
      <SafeAreaView style={[styles.safe, style]}>
        {hasOrbs && <OrbBackground />}

        {/* Main page content */}
        <View style={styles.inner}>
          {children}
        </View>

        {/* Floating sparkle AI button — above content, below drawer */}
        <FloatingAIButton />

        {/* Slide-in hamburger drawer — highest z-index, covers everything */}
        {menuOpen && (
          <View style={styles.drawerLayer} pointerEvents="box-none">
            <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
          </View>
        )}
      </SafeAreaView>
    </ScreenContext.Provider>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg1 },
  inner:       { flex: 1 },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default Screen;
