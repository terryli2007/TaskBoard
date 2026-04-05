/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 建议增加符合 Linear 风格的边框色
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
      }
    },
  },
  plugins: [],
}