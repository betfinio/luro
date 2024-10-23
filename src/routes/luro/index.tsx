import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/luro/')({
	beforeLoad: () => {
		throw redirect({ to: '/luro/$interval', params: { interval: '5m' } });
	},
});
