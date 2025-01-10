import { Outlet, createRootRoute } from '@tanstack/react-router';
import MockRoot from 'betfinio_context/components/MockRoot';
import { GlobalContextProvider } from 'betfinio_context/lib/context';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import 'betfinio_context/style';

export const Route = createRootRoute({
	component: () => (
		<GlobalContextProvider>
			<I18nextProvider i18n={i18n}>
				<MockRoot>
					<Outlet />
				</MockRoot>
			</I18nextProvider>
		</GlobalContextProvider>
	),
});
