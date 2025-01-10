import preset from '@betfinio/components/tailwind-config';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	important: '.luro',
	presets: [preset],
	content: ['./src/**/*.{ts,tsx}'],
	plugins: [animate],
};
