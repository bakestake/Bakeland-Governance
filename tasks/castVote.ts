import { task } from 'hardhat/config'
import { BakelandDAOHub__factory } from '../types';

// tasks/cast-vote.js
task("castVote", "Casts a vote on a proposal in BakelandDAOHub")
  .addParam("contract", "The address of the BakelandDAOHub contract")
  .addParam("proposalid", "The ID of the proposal to vote on")
  .addParam("support", "The type of vote: 0 = Against, 1 = For, 2 = Abstain")
  .addParam("response", "The response (bytes) from spoke chains")
  .addParam("signatures", "The signatures from Wormhole validators")
  .setAction(async (taskArgs, hre) => {
    try{
        const { contract, proposalid, support, response, signatures } = taskArgs;

        // Parse the inputs
        const parsedProposalId = parseInt(proposalid, 10);
        const parsedSupport = parseInt(support, 10);
        const parsedSignatures = JSON.parse(signatures);

        // Getting the signer (voter)
        const [voter] = await hre.ethers.getSigners();
        console.log("Casting vote with voter:", voter.address);

        const BakelandDAOHub = new hre.ethers.Contract(contract, BakelandDAOHub__factory.abi);

        const tx = await BakelandDAOHub.castVote(
        parsedProposalId,
        parsedSupport,
        response,
        parsedSignatures
        );

        console.log("Vote transaction hash:", tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    }catch(e){
        console.log(`Error occured: ${e}`)        
    }
    
  });
