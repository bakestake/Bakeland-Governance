import { task } from 'hardhat/config'
import { BakelandDAOHub__factory } from '../types';

task("createProposal", "Creates a proposal in BakelandDAOHub")
  .addParam("contract", "The address of the BakelandDAOHub contract")
  .addParam("targets", "The targets (array of addresses) for the proposal")
  .addParam("values", "The values (array of numbers) for the proposal")
  .addParam("calldatas", "The calldata (array of bytes) for the proposal")
  .addParam("description", "The description of the proposal")
  .setAction(async (taskArgs, hre) => {
    try{
        const { contract, targets, values, calldatas, description } = taskArgs;
    
        // Parse targets, values, and calldatas inputs
        const parsedTargets = JSON.parse(targets);
        const parsedValues = JSON.parse(values);
        const parsedCalldatas = JSON.parse(calldatas);

        // Getting the signer (deployer)
        const [deployer] = await hre.ethers.getSigners();
        console.log("Creating proposal with deployer:", deployer.address);

        // Attaching to the contract
        const daoInst = new hre.ethers.Contract(contract, BakelandDAOHub__factory.abi);

        const fees = await daoInst.quoteCrossChainCost();

        // Calling createProposal function
        const tx = await daoInst.createProposal(parsedTargets, parsedValues, parsedCalldatas, description, {
        value: fees // Example for sending some ETH for gas
        });

        console.log("Proposal creation transaction:", tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);

    }catch(e){
        console.log(`Error Occured - ${e}`)
    }
    
  });
