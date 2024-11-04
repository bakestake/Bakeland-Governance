import { task } from 'hardhat/config'
import { BakelandDAOHub__factory } from '../types';

// tasks/execute-proposal.js
task("execute-proposal", "Executes a proposal in BakelandDAOHub")
  .addParam("contract", "The address of the BakelandDAOHub contract")
  .addParam("targets", "The targets (array of addresses) for the proposal")
  .addParam("values", "The values (array of numbers) for the proposal")
  .addParam("calldatas", "The calldata (array of bytes) for the proposal")
  .addParam("descriptionhash", "The description hash of the proposal")
  .addParam("response", "The response (bytes) from spoke chains")
  .addParam("signatures", "The signatures from Wormhole validators")
  .setAction(async (taskArgs, hre) => {
    const { contract, targets, values, calldatas, descriptionhash, response, signatures } = taskArgs;

    // Parse inputs
    const parsedTargets = JSON.parse(targets);
    const parsedValues = JSON.parse(values);
    const parsedCalldatas = JSON.parse(calldatas);
    const parsedSignatures = JSON.parse(signatures);

    // Getting the signer (deployer)
    const [deployer] = await hre.ethers.getSigners();
    console.log("Executing proposal with deployer:", deployer.address);

    // Attaching to the contract
    const BakelandDAOHub = new hre.ethers.Contract(contract, BakelandDAOHub__factory.abi);

    // Calling execute function
    const tx = await BakelandDAOHub.execute(
      parsedTargets, 
      parsedValues, 
      parsedCalldatas, 
      descriptionhash, 
      response, 
      parsedSignatures,
      {
        value: hre.ethers.parseEther("0.1") // Example for sending some ETH for gas
      }
    );

    console.log("Execution transaction hash:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  });
