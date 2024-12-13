import logger from '@/src/config/logger.ts';
import { toast } from '@betfinio/components/hooks';
import { Button } from '@betfinio/components/ui';
import { useLatestVersion } from 'betfinio_app/github';
import { type FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
interface VersionValidationProps {
	repository: string;
	branch: string;
	current: string;
}
export const VersionValidation: FC<VersionValidationProps> = ({ branch, repository, current }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'toast.newVersion' });
	const { data: version } = useLatestVersion(repository, branch);
	useEffect(() => {
		logger.warn('Latest version:', version);
		logger.warn('Deployed version:', current);
		if (!version || !current) return;
		if (version.toLowerCase() !== current.toLowerCase()) {
			logger.warn('New version available!');
			toast({
				variant: 'soon',
				title: t('title'),
				action: (
					<Button size={'sm'} shape={'pill'} onClick={handleRefresh}>
						{t('action')}
					</Button>
				),
			});
		}
	}, [version, current, repository, branch]);
	const handleRefresh = () => {
		window.location.reload();
	};
	return null;
};
