/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				primaryBrown: '#7A3B33',
				posterBrown: '#6a3f36',
			},
			fontFamily: {
				// keep Playfair helper class in globals.css in case layout.tsx sets the font variable
				serif: ['var(--font-playfair)', 'serif'],
			},
		},
	},
	plugins: [],
};
