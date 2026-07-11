/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        anq: {
          navy: "#071b59",
          navy2: "#0B2E7A",
          blue: "#0058FF",
          red: "#F20D17",
          green: "#0EB56B",
          ink: "#081846",
          muted: "#647096",
          line: "#E5EAF4",
          soft: "#F7FAFF",
          panel: "#FFFFFF"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(8, 24, 70, 0.08)",
        card: "0 10px 30px rgba(8, 24, 70, 0.06)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
