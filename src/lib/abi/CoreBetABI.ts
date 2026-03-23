export const CoreBetABI = [
	{
		type: 'function',
		name: 'bet',
		inputs: [
			{ name: 'player', type: 'address', internalType: 'address' },
			{ name: 'recipient', type: 'address', internalType: 'address' },
			{ name: 'game', type: 'address', internalType: 'address' },
			{ name: 'amount', type: 'uint256', internalType: 'uint256' },
			{ name: 'data', type: 'bytes', internalType: 'bytes' },
			{ name: 'partner', type: 'address', internalType: 'address' },
		],
		outputs: [{ name: 'betAddress', type: 'address', internalType: 'address' }],
		stateMutability: 'nonpayable',
	},
] as const;
