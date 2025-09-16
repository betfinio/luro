import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';

const PORT = 4005;

export default defineConfig({
	server: {
		port: PORT,
		cors: {
			origin: '*',
		},
	},
	dev: {
		assetPrefix: `http://localhost:${PORT}`,
	},
	html: {
		title: 'Betfin Lucky Round',
		favicon: './src/assets/favicon.svg',
		template: './src/assets/index.html',
	},
	output: {
		assetPrefix: process.env.PUBLIC_OUTPUT_URL,
	},
	plugins: [
		pluginReact(),
		pluginModuleFederation(
			{
				name: 'betfinio_luro',
				remotes: {
					betfinio_context: `betfinio_context@${process.env.PUBLIC_CONTEXT_URL}/mf-manifest.json`,
				},
				exposes: {
					'./style': './src/style',
					'./i18n': './src/i18n',
					'./route': './src/routes/games/luro/$interval',
				},
				manifest: true,
				dts: {
					consumeTypes: {
						typesOnBuild: true,
					},
				},
				shared: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-query', 'i18next', 'react-i18next', 'wagmi'],
			},
			{},
		),
	],
	tools: {
		rspack: {
			ignoreWarnings: [/Critical dependency: the request of a dependency is an expression/],
			plugins: [TanStackRouterRspack()],
		},
	},
});
