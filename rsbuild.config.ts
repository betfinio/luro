import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
import { dependencies } from './package.json';

const getApp = () => {
	return `betfinio_app@${process.env.PUBLIC_APP_URL}/mf-manifest.json`;
};

export default defineConfig({
	server: {
		port: 4005,
	},
	dev: {
		assetPrefix: 'http://localhost:4005',
	},
	html: {
		title: 'Betfin - Lucky Round',
		favicon: './src/assets/favicon.svg',
	},
	output: {
		assetPrefix: process.env.PUBLIC_OUTPUT_URL,
	},
	plugins: [pluginReact()],
	tools: {
		rspack: {
			output: {
				uniqueName: 'betfinio_luro',
			},
			plugins: [
				TanStackRouterRspack(),
				new ModuleFederationPlugin({
					name: 'betfinio_luro',
					remotes: {
						betfinio_app: getApp(),
					},
					shared: {
						react: {
							singleton: true,
							requiredVersion: dependencies.react,
						},
						'react-dom': {
							singleton: true,
							requiredVersion: dependencies['react-dom'],
						},
						'@tanstack/react-router': {
							singleton: true,
							requiredVersion: dependencies['@tanstack/react-router'],
						},
						'@tanstack/react-query': {
							singleton: true,
							requiredVersion: dependencies['@tanstack/react-query'],
						},
						'lucide-react': {
							singleton: true,
							requiredVersion: dependencies['lucide-react'],
						},
						i18next: {
							singleton: true,
							requiredVersion: dependencies.i18next,
						},
						'react-i18next': {
							singleton: true,
							requiredVersion: dependencies['react-i18next'],
						},
						'tailwindcss-animate': {
							singleton: true,
							requiredVersion: dependencies['tailwindcss-animate'],
						},
						tailwindcss: {
							singleton: true,
							requiredVersion: dependencies.tailwindcss,
						},
						wagmi: {
							singleton: true,
							requiredVersion: dependencies.wagmi,
						},
						'i18next-browser-languagedetector': {
							singleton: true,
							requiredVersion: dependencies['i18next-browser-languagedetector'],
						},
					},
				}),
			],
		},
	},
});
