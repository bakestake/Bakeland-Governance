require('dotenv').config()

export const getProviderURLs = (networkName: string) => {
    switch (networkName) {
        case 'mainnet':
            return process.env.MAINNET
        case 'goerli':
            return process.env.GOERLI_URL
        case 'polygon':
            return process.env.POLYGON
        case 'amoy':
            return process.env.RPC_URL_AMOY
        case 'bsc':
            return process.env.BSC
        case 'bscTestnet':
            return process.env.RPC_URL_BSCTESTNET
        case 'avalanche':
            return process.env.AVALANCH
        case 'fuji':
            return process.env.RPC_URL_FUJI
        case 'arbitrum':
            return process.env.ARBITRUM
        case 'arbSepolia':
            return process.env.RPC_URL_ARBSEPOLIA
        case 'sepolia':
            return process.env.RPC_URL_SEPOLIA
        case 'beraTestnet':
            return process.env.RPC_URL_BERA
        case 'baseSepolia':
            return process.env.RPC_URL_BASE_SEPOLIA
        case 'coreTestnet':
            return process.env.RPC_URL_CORE_TESTNET
    }
}
