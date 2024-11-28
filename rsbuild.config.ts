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
			ignoreWarnings: [/Critical dependency: the request of a dependency is an expression/],
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
					manifest: false,
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
						i18next: {
							singleton: true,
							requiredVersion: dependencies.i18next,
						},
						'react-i18next': {
							singleton: true,
							requiredVersion: dependencies['react-i18next'],
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
