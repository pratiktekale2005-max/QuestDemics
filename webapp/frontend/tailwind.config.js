/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rpg: {
          bg: "#08080e",
          dark: "#0e0e1a",
          card: "#16162a",
          cardLight: "#20203c",
          border: "#2d2d54",
          borderLight: "#42427a",
          gold: "#f39c12",
          goldLight: "#f1c40f",
          xp: "#3498db",
          health: "#e74c3c",
          mana: "#9b59b6",
          rankE: "#95a5a6",
          rankD: "#2ecc71",
          rankC: "#3498db",
          rankB: "#9b59b6",
          rankA: "#e67e22",
          rankS: "#e74c3c",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        'rpg-glow': '0 0 15px rgba(243, 156, 18, 0.25)',
        'xp-glow': '0 0 10px rgba(52, 152, 219, 0.4)',
        'rank-glow': '0 0 20px rgba(231, 76, 60, 0.3)',
      }
    },
  },
  plugins: [],
}
