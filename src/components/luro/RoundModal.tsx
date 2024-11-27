import { ModalContent } from '@/src/components/luro/ModalContent.tsx';
import { type LuroInterval, getLuroInterval } from '@/src/lib';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { Dialog, DialogContent, DialogDescription, DialogPortal, DialogTitle } from '@betfinio/components/ui';
import { useNavigate } from '@tanstack/react-router';
import type { FC } from 'react';
import { useRound } from '../../lib/query';

const RoundModal: FC<{ round: number }> = ({ round }) => {
	const { data } = useRound(round);
	const navigate = useNavigate();
	const { interval } = Route.useParams();
	if (!data) return null;
	const handleClose = async () => {
		await navigate({ to: '/luro/$interval', params: { interval } });
	};
	return (
		<Dialog open={true} onOpenChange={handleClose}>
			<DialogPortal>
				<DialogContent className={'luro max-w-0 w-auto rounded-xl'}>
					<DialogTitle className={'hidden'} />
					<DialogDescription className={'hidden'} />
					<ModalContent onClose={handleClose} interval={getLuroInterval(interval as LuroInterval)} roundId={round} round={data} />
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default RoundModal;
