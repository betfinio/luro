import { Dialog, DialogContent, DialogDescription, DialogPortal, DialogTitle } from '@betfinio/components/ui';
import { useNavigate } from '@tanstack/react-router';
import type { FC } from 'react';
import { ModalContent } from '@/src/components/ModalContent.tsx';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { useRound } from '../lib/query';

const RoundModal: FC<{ round: number }> = ({ round }) => {
	const { data } = useRound(round);
	const navigate = useNavigate();
	const { interval } = Route.useParams();
	if (!data) return null;
	const handleClose = async () => {
		await navigate({ to: '/games/luro/$interval', params: { interval } });
	};
	return (
		<Dialog open={true} onOpenChange={handleClose}>
			<DialogPortal>
				<DialogContent className={'w-auto rounded-xl'}>
					<DialogTitle className={'hidden'} />
					<DialogDescription className={'hidden'} />
					<ModalContent roundId={round} round={data} />
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default RoundModal;
