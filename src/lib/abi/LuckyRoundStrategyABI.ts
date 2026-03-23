export const LuckyRoundStrategyABI = [
	{
		type: 'function',
		name: 'MAX_BETS_PER_ROUND',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'MIN_BET',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getBetsCount',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getRoundBet',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'index',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'tuple',
				internalType: 'struct LuckyRoundStrategy.LuckyRoundBet',
				components: [
					{
						name: 'betAddress',
						type: 'address',
						internalType: 'address',
					},
					{
						name: 'recipient',
						type: 'address',
						internalType: 'address',
					},
					{
						name: 'amount',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'startOffset',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'endOffset',
						type: 'uint256',
						internalType: 'uint256',
					},
				],
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'lastOffset',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'roundBank',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
] as const;
