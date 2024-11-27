/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	important: '.luro',
	presets: [require('@betfinio/components/tailwind-config')],
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
