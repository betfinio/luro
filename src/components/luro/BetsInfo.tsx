import { BetsTab } from '@/src/components/luro/tabs/BetsTab.tsx';
import { BonusTab } from '@/src/components/luro/tabs/BonusTab.tsx';
import { PlayersTab } from '@/src/components/luro/tabs/PlayersTab.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@betfinio/components/ui';
import { useTranslation } from 'react-i18next';

export const BetsInfo = () => {
	const { t } = useTranslation('luro', { keyPrefix: 'tabs' });

	return (
		<Tabs defaultValue={'bets'} className={'flex flex-col h-full'}>
			<TabsList className={'w-full bg-transparent justify-between gap-2 grid grid-cols-3'}>
				<TabsTrigger value={'players'}>{t('players')}</TabsTrigger>
				<TabsTrigger value={'bets'}>{t('bets')}</TabsTrigger>
				<TabsTrigger value={'bonuses'}>{t('bonus')}</TabsTrigger>
			</TabsList>

			<div className={'py-3 mt-3 min-h-[250px] overflow-y-auto rounded-xl bg-background-light grow flex flex-col gap-5 border-border border'}>
				<div className={'grow flex flex-col h-full'}>
					<TabsContent value={'players'} className={'overflow-hidden h-full'}>
						<PlayersTab />
					</TabsContent>
					<TabsContent value={'bets'} className={'overflow-hidden h-full'}>
						<BetsTab />
					</TabsContent>
					<TabsContent value={'bonuses'} className={'overflow-hidden h-full'}>
						<BonusTab />
					</TabsContent>
				</div>
			</div>
		</Tabs>
	);
};
