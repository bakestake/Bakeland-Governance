import { task } from 'hardhat/config'
import { getProviderURLs } from '../../utils/getProviderUrl'

// 0xE3e4354978c4dbA6a743c0a20e4D940Fde830f3A - deployed address

task('deploy-dao', 'Deploys DAO Smart contract')
    .addParam('chain', 'network to deploy')
    .setAction(async (taskArgs, hre) => {
        await hre.run('compile')

        const providerURL = getProviderURLs(taskArgs.chain);

        const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY||"", new hre.ethers.JsonRpcProvider(providerURL))

        const { abi, bytecode } = await hre.artifacts.readArtifact("BakelandDAO")
        const factory = new hre.ethers.ContractFactory(abi, bytecode, signer)

        const contract = await hre.upgrades.deployProxy(
            factory,
            ["0x3e248B8781B89234eb025611D36ff584D20cAa14","0x24BD0713c32676b8438CAC6CCcB2686931E12Cd8"], //insert token and timelock addre
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
