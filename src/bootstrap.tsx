import { RouterProvider, createRouter } from '@tanstack/react-router';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@/src/globals.css';
import '@betfinio/components';

import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

// Render the app
const rootElement = document.getElementById('root');
if (rootElement) {
	const root = createRoot(rootElement);
	root.render(<RouterProvider router={router} />);
}
