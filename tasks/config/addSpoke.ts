import { task } from 'hardhat/config'
import { BakelandDAOHub__factory } from '../../types';

// tasks/cast-vote.js
task("add-spoke", "Casts a vote on a proposal in BakelandDAOHub")
  .addParam("contract", "The address of the BakelandDAOHub contract")
  .addParam("chaindids", "Array of chain ids")
  .addParam("addresses", "Array of peer addresses")
  .setAction(async (taskArgs, hre) => {
    try{
        const { contract, chainIds, peers } = taskArgs;

        // Getting the signer (voter)
        const [voter] = await hre.ethers.getSigners();
        console.log("Casting vote with voter:", voter.address);

        const BakelandDAOHub = new hre.ethers.Contract(contract, BakelandDAOHub__factory.abi);

        const tx = await BakelandDAOHub.addNewPeers(chainIds, peers);

        console.log("Vote transaction hash:", tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    }catch(e){
        console.log(`Error occured: ${e}`)        
    }
    
  });
