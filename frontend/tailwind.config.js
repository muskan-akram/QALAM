/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT:'#0E1C2F', mid:'#1A2E47', light:'#253D5E' },
        gold:  { DEFAULT:'#C8993A', light:'#E5BF72', dark:'#9A7225' },
        mint:  { DEFAULT:'#00B89F', light:'#00D4B8', dark:'#008F7A' },
        cream: { DEFAULT:'#F6F4EF', dark:'#F0EDE6' },
        ink:   { DEFAULT:'#1A1410', mid:'#3C3228', soft:'#6B5F50', muted:'#A0937E' },
      },
      fontFamily: {
        display: ['"Playfair Display"','Georgia','serif'],
        body:    ['"Outfit"','system-ui','sans-serif'],
        urdu:    ['"Noto Nastaliq Urdu"','serif'],
      },
    }
  },
  plugins:[]
}