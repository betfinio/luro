export const LuckyRoundStrategyABI = [
	{
		type: 'constructor',
		inputs: [
			{ name: '_game', type: 'address', internalType: 'address' },
			{ name: '_token', type: 'address', internalType: 'address' },
			{ name: '_staking', type: 'address', internalType: 'address' },
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'GAME',
		inputs: [],
		outputs: [{ name: '', type: 'address', internalType: 'address' }],
		stateMutability: 'view',
	},
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
		name: 'STAKING',
		inputs: [],
		outputs: [{ name: '', type: 'address', internalType: 'address' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'TOKEN',
		inputs: [],
		outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
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
		name: 'getNumRandomWords',
		inputs: [],
		outputs: [{ name: '', type: 'uint32', internalType: 'uint32' }],
		stateMutability: 'pure',
	},
	{
		type: 'function',
		name: 'getNumRandomWordsForRound',
		inputs: [],
		outputs: [{ name: '', type: 'uint32', internalType: 'uint32' }],
		stateMutability: 'pure',
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
		name: 'processRoundSlice',
		inputs: [
			{ name: '', type: 'uint256', internalType: 'uint256' },
			{ name: '', type: 'uint256', internalType: 'uint256' },
			{ name: '', type: 'uint256', internalType: 'uint256' },
			{ name: '', type: 'uint256', internalType: 'uint256' },
		],
		outputs: [
			{ name: '', type: 'uint256', internalType: 'uint256' },
			{ name: '', type: 'bool', internalType: 'bool' },
			{ name: '', type: 'uint256', internalType: 'uint256' },
		],
		stateMutability: 'pure',
	},
	{
		type: 'function',
		name: 'refundBet',
		inputs: [{ name: '', type: 'address', internalType: 'address' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'refundRound',
		inputs: [{ name: 'roundId', type: 'uint256', internalType: 'uint256' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'resolveHouseBet',
		inputs: [
			{ name: '', type: 'address', internalType: 'address' },
			{ name: '', type: 'uint256[]', internalType: 'uint256[]' },
		],
		outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'resolveRound',
		inputs: [
			{ name: 'roundId', type: 'uint256', internalType: 'uint256' },
			{ name: 'randomWords', type: 'uint256[]', internalType: 'uint256[]' },
		],
		outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
		stateMutability: 'nonpayable',
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
	{
		type: 'function',
		name: 'roundBets',
		inputs: [
			{ name: 'roundId', type: 'uint256', internalType: 'uint256' },
			{ name: '', type: 'uint256', internalType: 'uint256' },
		],
		outputs: [
			{ name: 'betAddress', type: 'address', internalType: 'address' },
			{ name: 'recipient', type: 'address', internalType: 'address' },
			{ name: 'amount', type: 'uint256', internalType: 'uint256' },
			{ name: 'startOffset', type: 'uint256', internalType: 'uint256' },
			{ name: 'endOffset', type: 'uint256', internalType: 'uint256' },
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'validateBet',
		inputs: [
			{ name: '', type: 'address', internalType: 'address' },
			{ name: 'bet', type: 'address', internalType: 'address' },
			{ name: 'amount', type: 'uint256', internalType: 'uint256' },
			{ name: 'amountReceived', type: 'uint256', internalType: 'uint256' },
			{ name: 'roundId', type: 'uint256', internalType: 'uint256' },
			{ name: 'data', type: 'bytes', internalType: 'bytes' },
		],
		outputs: [{ name: 'reserveAmount', type: 'uint256', internalType: 'uint256' }],
		stateMutability: 'nonpayable',
	},
	{ type: 'error', name: 'BetTooSmall', inputs: [] },
	{ type: 'error', name: 'OnlyGame', inputs: [] },
	{ type: 'error', name: 'RoundFull', inputs: [] },
	{ type: 'error', name: 'RoundMismatch', inputs: [] },
] as const;
