/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	important: '.luro',
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
