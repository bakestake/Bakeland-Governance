import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";
import { task, vars } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
import "./tasks/index"
import { network } from "hardhat";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";


// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const mnemonic: string = vars.get("MNEMONIC");
const infuraApiKey: string = vars.get("INFURA_API_KEY");

const chainIds = {
  "arbitrum-mainnet":42161,
  avalanche:43114,
  bsc:56,
  ganache:1337,
  hardhat:31337,
  mainnet:1,
  "optimism-mainnet":10,
  "polygon-mainnet":137,
  sepolia:11155111,
  beraTestnet:80084,
  amoy:80002,
  bscTestnet:97,
  fuji:43113,
  arbSepolia:421614,
  baseSepolia:84532,
  coreTestnet: 1115
};

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string;
  switch (chain) {
    case "avalanche":
      jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc";
      break;
    case "bsc":
      jsonRpcUrl = "https://bsc-dataseed1.binance.org";
      break;
    case "bscTestnet":
      jsonRpcUrl = "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
      break;
    case "fuji":
      jsonRpcUrl = "https://api.avax-test.network/ext/bc/C/rpc";
      break;
    case "amoy":
      jsonRpcUrl = "https://polygon-amoy.g.alchemy.com/v2/m-HgDS8nYeULpTlmWmVau-bVmvIsVkTE";
      break;
    case "arbSepolia":
      jsonRpcUrl = "https://arb-sepolia.g.alchemy.com/v2/VlUjqCz1EOJ2EhrYPv7LpCyXApggvU25";
      break;
    case "beraTestnet":
      jsonRpcUrl = "https://bartio.rpc.berachain.com/";
      break;
    case "baseSepolia":
      jsonRpcUrl = "https://base-sepolia.g.alchemy.com/v2/m-HgDS8nYeULpTlmWmVau-bVmvIsVkTE";
      break;
    case "coreTestnet":
      jsonRpcUrl = "https://rpc.test.btcs.network"
      break;
    default:
      jsonRpcUrl = "https://rpc.ankr.com/" + chain + "/"+infuraApiKey;
  }
  return {
    accounts: [process.env.PRIVATE_KEY||""],
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      arbitrumOne: vars.get("ARBISCAN_API_KEY", ""),
      fuji:"fuji",
      bscTestnet: process.env.BSC_TESTNET_API_KEY || "",
      mainnet: vars.get("ETHERSCAN_API_KEY", ""),
      polygon: vars.get("POLYGONSCAN_API_KEY", ""),
      amoy: process.env.POLYSCAN_API_KEY || "",
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
      arbSepolia: process.env.ARBSEPOLIA_TESTNET_API_KEY || "",
      beraTestnet: "bartio_testnet",
      baseSepolia: process.env.BASE_TESTNET_API_KEY || "",
      coreTestnet: "api key"
    },
    customChains:[
        {
          network: "amoy",
          chainId: 80002,
          urls: {
              apiURL: "https://api-amoy.polygonscan.com/api",
              browserURL: "https://amoy.polygonscan.com/"
          }
        },
        {
          network: "fuji",
          chainId: 43113,
          urls: {
            apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
            browserURL: "https://43113.testnet.routescan.io/"
          }
        },
        {
          network: "beraTestnet",
          chainId: 80084,
          urls: {
              apiURL:"https://api.routescan.io/v2/network/testnet/evm/80084/etherscan/api/",
              browserURL: "https://bartio.beratrail.io/",
          }
        },
        {
          network: "baseSepolia",
          chainId: 84532,
          urls:{
            apiURL:"https://api-sepolia.basescan.org",
            browserURL:"https://sepolia-explorer.base.org"
          }
        },
        {
          network: "arbSepolia",
          chainId: 421614,
          urls:{
            apiURL:"https://api-sepolia.arbiscan.io/api",
            browserURL:"https://sepolia.arbiscan.io/"
          }
        },
        {
       network: "coreTestnet",
       chainId: 1115,
       urls: {
         apiURL: "https://api.test.btcs.network/api",
         browserURL: "https://scan.test.btcs.network/"
       }
     }
    ]
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  sourcify: {
    enabled: true
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      forking: {
        url: `https://polygon-amoy.g.alchemy.com/v2/m-HgDS8nYeULpTlmWmVau-bVmvIsVkTE`,
      },
      chainId: chainIds.amoy,
    },
    ganache: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.ganache,
      url: "http://localhost:8545",
    },
    arbitrum: getChainConfig("arbitrum-mainnet"),
    avalanche: getChainConfig("avalanche"),
    bsc: getChainConfig("bsc"),
    "polygon-mainnet": getChainConfig("polygon-mainnet"),
    sepolia: getChainConfig("sepolia"),
    bscTestnet:getChainConfig("bscTestnet"),
    amoy:getChainConfig("amoy"),
    fuji:getChainConfig("fuji"),
    arbSepolia:getChainConfig("arbSepolia"),
    beraTestnet:getChainConfig("beraTestnet"),
    baseSepolia: getChainConfig("baseSepolia"),
    coreTestnet: getChainConfig("coreTestnet")
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    ],
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};


task(
  "account",
  "returns nonce and balance for specified address on multiple networks"
)
  .addParam("address")
  .setAction(async (address) => {
    const web3Bera = createAlchemyWeb3(process.env.RPC_URL_BERA || "");
    const web3Mumbai = createAlchemyWeb3(process.env.RPC_URL_AMOY || "");
    const web3bsc = createAlchemyWeb3(
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    );
    const web3arb = createAlchemyWeb3(process.env.RPC_URL_ARBSEPOLIA || "");
    const web3fuji = createAlchemyWeb3(process.env.RPC_URL_FUJI || "");
    const web3baseSep = createAlchemyWeb3(process.env.RPC_URL_BASE_SEPOLIA ||
     "");
    const web3CoreTest = createAlchemyWeb3(process.env.RPC_URL_CORE_TESTNET || "");

    const networkIDArr = [
      "bera:",
      "amoy:",
      "bscTestnet",
      "arbSepolia",
      "fuji",
      "baseSepolia",
      "coreTestnet"
    ];
    const providerArr = [web3Bera, web3Mumbai, web3bsc, web3arb, web3fuji, web3baseSep, web3CoreTest];
    const resultArr = [];

    for (let i = 0; i < providerArr.length; i++) {
      const nonce = await providerArr[i].eth.getTransactionCount(
        address.address,
        "latest"
      );
      const balance = await providerArr[i].eth.getBalance(address.address);
      resultArr.push([
        networkIDArr[i],
        nonce,
        parseFloat(providerArr[i].utils.fromWei(balance, "ether")).toFixed(2) +
          "ETH",
      ]);
    }
    resultArr.unshift(["  |NETWORK|   |NONCE|   |BALANCE|  "]);
    console.log(resultArr);
  });

export default config;
