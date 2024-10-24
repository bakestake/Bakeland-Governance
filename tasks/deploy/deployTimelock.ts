import { task } from 'hardhat/config'
import { getProviderURLs } from '../../utils/getProviderUrl'

task('deploy-timelock', 'Deploys timelock Smart contract')
    .addParam('chain', 'network to deploy')
    .setAction(async (taskArgs, hre) => {
        await hre.run('compile')

        const providerURL = getProviderURLs(taskArgs.chain);

        const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY||"", new hre.ethers.JsonRpcProvider(providerURL))

        const { abi, bytecode } = await hre.artifacts.readArtifact("Timelock")
        const factory = new hre.ethers.ContractFactory(abi, bytecode, signer)

        const contract = await hre.upgrades.deployProxy(
            factory,
            ["86400", ["0x5EF0d89a9E859CFcA0C52C9A17CFF93f1A6A19C1"], ["0x5EF0d89a9E859CFcA0C52C9A17CFF93f1A6A19C1"], "0x5EF0d89a9E859CFcA0C52C9A17CFF93f1A6A19C1"],
            {
                initializer: 'initialize_timelock',
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
