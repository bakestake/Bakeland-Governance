import { task } from 'hardhat/config'
import { getProviderURLs } from '../../utils/getProviderUrl'

// 0xE3e4354978c4dbA6a743c0a20e4D940Fde830f3A - deployed address

task('deploy-spoke-dao', 'Deploys DAO Smart contract')
    .addParam('chain', 'network to deploy')
    .addPositionalParam('tokenAddress')
    .addPositionalParam('timelock')
    .addPositionalParam('relayer')
    .addPositionalParam('hub')
    .addPositionalParam('chainid')
    .addPositionalParam('hubchainid')
    .addPositionalParam('chains')
    .setAction(async (taskArgs, hre) => {
        await hre.run('compile')

        const providerURL = getProviderURLs(taskArgs.chain);

        const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY||"", new hre.ethers.JsonRpcProvider(providerURL))

        const { abi, bytecode } = await hre.artifacts.readArtifact("BakelandDAO")
        const factory = new hre.ethers.ContractFactory(abi, bytecode, signer)

        /// @param _token Token address of veBuds[ERC20Votes]
        /// @param _timelock Timelock contract address
        /// @param _wormholeRelayer Relayer address
        /// @param _hubDaoContract Hub contract address from hub chain
        /// @param _curChainId Chain id of chain where this contract is deployed at in wormhole format
        /// @param hubChainId Chain id of hub chain
        /// @param noOfChains Number of chains where DAO is operational

        const contract = await hre.upgrades.deployProxy(
            factory,
            [taskArgs.tokenAddress,taskArgs.timelock,taskArgs.relayer, taskArgs.hub, taskArgs.chainid, taskArgs.hubchainid, taskArgs.chains], /// INSERT PARAMS HERE
            {
                initializer: 'initialize',
                pollingInterval: taskArgs.chain == "beraTestnet" ? 10 : 500,
                unsafeAllow: ['state-variable-assignment'],
            }
        )

        console.log("waiting for deployment");

        await contract.deploymentTransaction()?.wait(taskArgs.chain == "amoy" ? 5 : taskArgs.chain == "beraTestnet" ? 1 : 3)

        console.log(`
🚀 Successfully deployed contract on ${taskArgs.chain}.
📜 Contract address: ${contract.target}`)

        return contract.target
    })
