const Colors = {
  primary: "#38BDF8",        // soft glowing blue (used for active icons, highlights)
  secondary: "#0EA5E9",      // slightly deeper accent blue
  accent: "#60A5FA",          // lighter accent for secondary highlights
  warning: "#FBBF24",         // warnings or alerts

  dark: {
    background: "#192132",     // softened dark blue-gray background
    surface: "#232B3B",        // lighter card background
    navBackground: "#232B3B",  // header/tab bar
    text: "#E2E8F0",           // normal text
    title: "#F8FAFC",          // headings
    muted: "#8CA0C1",           // lighter secondary text
    border: "#2C3A4D",          // lighter card border / divider
    icon: "#A3B8D1",            // inactive icon color
    iconFocused: "#60A5FA",     // active icon color (softer blue)
    shadow: "rgba(56, 189, 248, 0.10)",
    dontKnow: "#3B82F6",
    languagesDontKnow: "#232B3B",
  },

  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    navBackground: "#EEF2FF",
    text: "#334155",
    title: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
    icon: "#475569",
    iconFocused: "#2F6FED",
    shadow: "rgba(56, 189, 248, 0.15)",
    dontKnow: "#2F6FED",
    languagesDontKnow: "#e4e4ed",
  },
};

export default Colors;
