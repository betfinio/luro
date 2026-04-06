export const BetABI = [
	{
		type: 'constructor',
		inputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'amount',
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
		name: 'data',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'bytes',
				internalType: 'bytes',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'game',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'initialize',
		inputs: [
			{ name: '_player', type: 'address', internalType: 'address' },
			{ name: '_recipient', type: 'address', internalType: 'address' },
			{ name: '_amount', type: 'uint256', internalType: 'uint256' },
			{ name: '_game', type: 'address', internalType: 'address' },
			{ name: '_strategy', type: 'address', internalType: 'address' },
			{ name: '_reserveAmount', type: 'uint256', internalType: 'uint256' },
			{ name: '_roundId', type: 'uint256', internalType: 'uint256' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'payout',
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
		name: 'player',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'recipient',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'reserveAmount',
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
		name: 'result',
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
		name: 'roundId',
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
		name: 'setData',
		inputs: [{ name: '_data', type: 'bytes', internalType: 'bytes' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setPayout',
		inputs: [{ name: '_payout', type: 'uint256', internalType: 'uint256' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setReserveAmount',
		inputs: [{ name: '_reserveAmount', type: 'uint256', internalType: 'uint256' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setResult',
		inputs: [{ name: '_result', type: 'uint256', internalType: 'uint256' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setStatus',
		inputs: [{ name: '_status', type: 'uint8', internalType: 'enum IBet.BetStatus' }],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'status',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint8',
				internalType: 'enum IBet.BetStatus',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'strategy',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{ type: 'error', name: 'AlreadyInitialized', inputs: [] },
	{ type: 'error', name: 'BetNotPending', inputs: [] },
	{ type: 'error', name: 'OnlyGame', inputs: [] },
	{ type: 'error', name: 'OnlyGameOrStrategy', inputs: [] },
	{ type: 'error', name: 'PayoutAlreadySet', inputs: [] },
	{ type: 'error', name: 'ReserveAlreadySet', inputs: [] },
	{ type: 'error', name: 'ResultAlreadySet', inputs: [] },
] as const;
