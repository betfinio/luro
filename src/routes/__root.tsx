import { VersionValidation } from '@/src/components/VersionValidation.tsx';
import instance from '@/src/i18n.ts';
import { Toaster } from '@betfinio/components/ui';
import { createRootRoute } from '@tanstack/react-router';
import { Root } from 'betfinio_app/root';
import React from 'react';

export const Route = createRootRoute({
	component: () => (
		<Root id={'luro'} instance={instance}>
			<VersionValidation repository={'roulette'} branch={import.meta.env.PUBLIC_BRANCH} current={import.meta.env.PUBLIC_DEPLOYED} />
			<Toaster />
		</Root>
	),
});
