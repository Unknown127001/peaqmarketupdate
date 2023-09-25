// tailwind.config.js
const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
 
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  themes: {
    "purple-dark": {
      extend: "dark", // <- inherit default values from dark theme
      colors: {
        background: "#0D001A",
        foreground: "#ffffff",
        primary: {
  50: '#ffe8e8',
  100: '#f0c4c4',
  200: '#e09f9f',
  300: '#d2797a',
  400: '#c45454',
  500: '#ab3b3b',
  600: '#862d2e',
  700: '#612020',
  800: '#3c1212',
  900: '#1c0303',
          DEFAULT: "#ab3b3b",
          foreground: "#ffffff",
        },
        focus: "#862d2e",
      },
      layout: {
        disabledOpacity: "0.3",
        radius: {
          small: "4px",
          medium: "6px",
          large: "8px",
        },
        borderWidth: {
          small: "1px",
          medium: "2px",
          large: "3px",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui(),
  ],
};