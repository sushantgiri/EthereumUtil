module.exports = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_issuer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "_did",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			}
		],
		"name": "DID",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_did",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			}
		],
		"name": "SetRevokeCodeDID",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			}
		],
		"name": "SetRevokeCodeVC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_issuer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "_revokeCode",
				"type": "uint256"
			}
		],
		"name": "VC",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_did",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_issuer",
				"type": "address"
			}
		],
		"name": "GetRevokeCodeDID",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "_issuer",
				"type": "address"
			}
		],
		"name": "GetRevokeCodeVC",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]