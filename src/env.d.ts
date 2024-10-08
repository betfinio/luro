/// <reference types="@rsbuild/core/types" />
import '@tanstack/react-router';
import type { Address } from 'viem';

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

interface ImportMetaEnv {
	readonly PUBLIC_TOKEN_ADDRESS: Address;
}
