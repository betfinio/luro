import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/luro/')({
	beforeLoad: () => {
		throw redirect({ to: '/luro/promo' });
	},
});
