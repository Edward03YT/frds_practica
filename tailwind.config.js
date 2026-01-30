/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Adaugă și alte foldere dacă ai
    "./src/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      transitionDuration: {
        250: "250ms",
        300: "300ms",
        400: "400ms",
      },
      transitionProperty: {
        opacity: "opacity",
      },
      // Exemplu de paletă custom
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          dark: "#1e40af",
          light: "#3b82f6",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
  // Safelist pentru clase generate dinamic (opțional)
  safelist: [
    {
      pattern: /bg-(red|green|blue|yellow|purple|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(red|green|blue|yellow|purple|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
  ],
};