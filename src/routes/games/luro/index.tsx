import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/games/luro/')({
	beforeLoad: () => {
		throw redirect({ to: '/games/luro/$interval', params: { interval: '210s' } });
	},
});
