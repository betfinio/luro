import { createFileRoute } from '@tanstack/react-router';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/luro/soon')({
	component: LuroSoon,
});

function LuroSoon() {
	const deployTimestamp = 1723226400; // Unix timestamp in seconds
	const deploy = DateTime.fromSeconds(deployTimestamp);

	const [diff, setDiff] = useState(deploy.diffNow(['days', 'hours', 'minutes', 'seconds']));

	useEffect(() => {
		const i = setInterval(() => {
			setDiff(deploy.diffNow(['days', 'hours', 'minutes', 'seconds']));
		}, 1000);
		return () => clearInterval(i);
	}, []);

	return (
		<div className=" h-full w-full text-black min-h-[100vh] bg-luro-sm md:bg-luro bg-no-repeat bg-cover md:bg-contain ">
			<div className={'w-full h-full backdrop-blur-xl flex items-center justify-center'}>
				<div className={'rounded-xl bg-yellow-400 px-6 py-4 w-[340px] text-center'}>
					<div className={'text-xl font-semibold'}>Coming soon</div>
					<div>
						{(diff.days > 0 ? `${diff.days} days ` : '') +
							(diff.hours > 0 ? `${diff.hours} hours ` : '') +
							(diff.minutes > 0 ? `${Math.floor(diff.minutes)} minutes ` : '') +
							(diff.seconds > 0 ? `${Math.floor(diff.seconds)} seconds ` : '')}
					</div>
				</div>
			</div>
		</div>
	);
}
