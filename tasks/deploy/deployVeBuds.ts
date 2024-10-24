import { task } from 'hardhat/config'
import { getProviderURLs } from '../../utils/getProviderUrl'

task('deploy-vebuds', 'Deploys veBuds Smart contract')
    .addParam('chain', 'network to deploy')
    .setAction(async (taskArgs, hre) => {
        await hre.run('compile')

        const providerURL = getProviderURLs(taskArgs.chain);

        const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY||"", new hre.ethers.JsonRpcProvider(providerURL))

        const { abi, bytecode } = await hre.artifacts.readArtifact("veBuds")
        const factory = new hre.ethers.ContractFactory(abi, bytecode, signer)

        const contract = await hre.upgrades.deployProxy(
            factory,
            [],
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
