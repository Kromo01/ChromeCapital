/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#111720",
        surfaceRaised: "#171F29",
        border: "#232C38",
        borderSoft: "#1B222C",
        ink: "#E9EDF2",
        inkMuted: "#8A96A6",
        inkFaint: "#576174",
        gold: "#D4A94F",
        goldBright: "#F0C868",
        goldDim: "#8A6C2E",
        chrome: "#B8C4D0",
        chromeDim: "#5B6672",
        slate: "#6B7684",
        teal: "#4FB8A9",
        ember: "#C2562E",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
};
