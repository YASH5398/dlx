module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B3D91', // dark blue
        secondary: '#000000', // black
        accent: '#1E40AF', // optional lighter blue for highlights
      },
      backgroundImage: {
        'dark-gradient': 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)',
      },
    },
  },
  plugins: [],
}
