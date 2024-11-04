# Wormhole Sigma Submission
  ![image](https://github.com/user-attachments/assets/f2dbc9b0-d6c4-4644-ad0e-87036b5c42d4)

# Bakeland Multi-GOV
  <p align="center" width="100%">
    <img src="https://github.com/user-attachments/assets/9c172c13-c41f-4a81-8566-55e07a8ea359" width=200 height=200 align=center>
  </p>

## Problem statement

95% of our crypto-native userbase has a preferred network to store assets and transact on. This reveals the larger issue of tribalism which is characteristic of our space - which has led to fragmented communities in silos of walled-off ecosystems.

This is in contrast to the increasing number of protocols which decide to deploy across multiple networks to tap into the liquidity and userbase across all of them - unlocking increased distribution for their product. Undoubtedly, this is the future of dApps - for it makes little sense to intentionally cap your distribution on a single chain with solutions such as Wormhole CCQ and composable intents available for builders.

However, such protocols face a serious problem on the GTM side due to this paradoxical situation. Having a community spread out across different silos often leads to reduced cohesiveness, and hinders the team/foundation's ability to communicate effectively to a misaligned audience.

A solution such as Multi-Gov is the step in the right direction to unify these walled-off communities and allow a whole new form of governance which is based on neutrality - allowing communities from each network to participate in governance - collectively deciding on positive-sum outcomes for all networks involved. This not only forms a better structure for multi-chain communities, but promotes dialogue on increasing value creation/optimization across multiple ecosystems. Something we require urgently in the space to move ahead.

Bakeland is among the first natively multi-chain economies powered by real-time composability - which Wormhole CCQ enables. This makes it among the most suitable to showcase the unique benefits of multi-chain governance.

For context, Bakeland has pools of $BUDS across multiple spoke networks, with Berachain acting as the hub of liquidity. Each network receives proportional emissions of $BUDS depending on the saturation factor of the pool. For more info regarding the saturation factor, kindly refer to [this](https://github.com/bakestake/bakeland-contracts-wormhole) submission.

When a user stakes $BUDS on any chain, an NTT LST $stBUDS is minted on Berachain. Additional value is created by restaking $stBUDS in rewards vaults on Berachain, which gives our BGT emissions and $veBUDS to depositors. This streamlines access to the benefits of Proof-of-Liquidity by unifying the interface level - which we further intend to improve with composable intents.
And more importantly for this topic, it makes Multi-Gov a crucial element for our users - where users from any of our supported networks can participate in Bakeland DAO to vote on how $BUDS emissions will be directed to pools and what the incentive rate offered to validators on Berachain will be.This will also democratize the additional and removal of pools, as the team is working on a solution to keep pool deployments 'modular' to allow for strategic decisions by the DAO as pools on certain chains lose traction/relevance.

eg. Pool X becomes stagnant and the DAO can vote to remove said pool and deploy it to new chain with active liquidity and users. For instance an upcoming chain like Monad. This ensures Bakeland can adapt to major changes without being exposed to additional risk with multiple redundancies.

## Project structure
    ├── contracts                 
    |    └── hub
    |    |      └── BakelandDAOHub.sol      #Hub DAO contract
    |    └── spoke
    |    |      └── BakelandDAOSpoke.sol    #Spoke DAO contract
    |    └── token
    |    |      └── VeBuds.sol              #Gov token contract
    |    - Timelock.sol                     #Timelock contract
    ├── tasks                     # tasks for invoking functions
    |      └── config              # on-chain config tasks
    |      └── deploy              # deploy contract tasks
    |      └── other tasks
    |      └── index.ts            # exports all hardhat tasks to environment
    |      
    ├── wormhole                  # service responsible for cross-chain query 
    |   └── handlers              # contains all handlers performing **CCQ** for specific purpose
    |       └── voteValidation.js
    |       └── fetchVoteFromSpokes.js
    |   └── handler.js            
    |   └── index.js              # file configuring express app
    |   └── server.js             # entrypoint for running server
    ├── LICENSE
    ├── hardhat.config.ts  
    ├── package.json
    ├── README.md
    └── tsconfig.json


## Why Wormhole
  1. Saves users time and money (as opposed to cross-chain messaging for high-frequency/low-value data)
  2. Ease of implementation
  3. Security
  4. Good dev support

## Bakeland Multi-DAO: Wormhole Usage & Features

Bakeland Multi-DAO utilizes Wormhole technology to enable decentralized, cross-chain governance. This system ensures that users holding assets on multiple chains can participate effectively while preventing double voting.

### We have utilized following wormhole features
  1. Wormhole queries
  2. Wormhole CCM
  3. NTT for veBuds token
     
---

### Architecture
#### Hub & spoke model
  <p width="100%">
    <img src="https://github.com/user-attachments/assets/61de16f7-ae53-455e-a5f5-7b31d93f5087" width=600 height=400>
  </p>

#### Proposal creation on hub
  <p width="100%">
    <img src="https://github.com/user-attachments/assets/3516c364-a65e-4894-81ac-5a44c203bf06" width=600 height=400>
  </p>

#### Casting vote on spoke chain
  <p width="100%">
    <img src="https://github.com/user-attachments/assets/65a0b60a-2738-4a90-9e1a-faa5108f5304" width=600 height=400>
  </p>

#### Proposal execution on hub chain
  <p width="100%">
    <img src="https://github.com/user-attachments/assets/f657c8bf-8c20-427f-922e-cf9bd608f180" width=600 height=400>
  </p>


### Key Features

1. **Proposal Creation on a Single Hub Chain**  
   Governance proposals are initiated on a designated hub chain, simplifying proposal management and allowing for centralized tracking.

2. **Vote Casting on Multiple Chains**  
   Users can cast their votes on multiple chains where they hold assets, providing flexibility and inclusivity in governance participation.

3. **No Double Voting Across Chains**  
   Wormhole queries validate voting status to prevent users from casting multiple votes for the same proposal across different chains.

4. **Execution on a Single Hub Chain**  
   After the voting process is complete, the final execution occurs on the hub chain. Wormhole queries are used to aggregate votes from multiple chains and ensure a final accurate count for execution.

---

### Future Considerations

1. **Fractional Vote Weight Based on Global veBuds Balance**  
   Future updates will introduce proportional voting power based on the user's global veBuds balance, taking into account their assets across all chains:

   - **Global veBuds Balance Consideration**: Users' total veBuds balance across all chains will be considered to assign voting power proportionally.
   
   - **Incentivizing Consolidation**: Users are encouraged to consolidate their veBuds on a single chain of their choice to maximize voting power. A consolidated balance gives more weight to the user's vote.

   - **Eliminating Double Voting**: Users holding veBuds on multiple chains will have their vote weight distributed proportionally based on their global balance, reducing the chance of double voting.

   - **Full Vote Power**: 
     - Users can consolidate their veBuds on a preferred chain to exercise full voting power in a single vote.
     - Alternatively, users may vote on all chains where they hold veBuds, with proportional weight on each chain.

   - **Wormhole Validation**: Wormhole queries will validate the global distribution of users' veBuds balance before allowing them to vote, ensuring accurate representation of vote power across chains.

---

## Code snippets

### Publishing proposal to all spoke chains
   ```
   function createProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public payable returns (uint256) {
        uint256 proposalId = super.propose(
            targets,
            values,
            calldatas,
            description
        );
        uint256 cost = quoteCrossChainCost();
        if (msg.value < cost) revert();

        bytes memory dataToPublish = abi.encode(
            targets,
            values,
            calldatas,
            description,
            msg.sender
        );

        for (uint i = 0; i < spokePeerIds.length; i++) {
            (uint256 _curCost, ) = _wormhole.quoteEVMDeliveryPrice(
                spokePeerIds[i],
                0,
                2_500_000
            );

            _wormhole.sendPayloadToEvm{value: _curCost}(
                spokePeerIds[i],
                spokeAddresseBychainId[spokePeerIds[i]],
                abi.encode(dataToPublish, msg.sender),
                0,
                2_500_000
            );
        }

        return proposalId;
    }
   ```
### Receiving and creating a proposal on spoke
   ```
   function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32
    ) public payable override {
        if(sourceAddress != _hubAddress || sourceChain != _hubChainId) revert InvalidSender();
        if(msg.sender != address(_wormhole)) revert InvalidRelayer();
        (IWormhole.VM memory vm, bool valid, string memory reason) = IWormhole(address(_wormhole)).parseAndVerifyVM(payload);
        if(!valid) revert InvalidVaa(reason);

        (address destAddr, uint16 destChainId) = abi.decode(vm.payload, (address, uint16));
        if(destAddr != address(this)) revert InvalidReceiverAddress();
        if(destChainId != _chainId) revert InvalidReceiverChainId();

        if(replayGuard[vm.hash]) revert ReplayCcmDetected();


        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description
        ) = abi.decode(payload, (address[], uint256[], bytes[], string));

        super.propose(
            targets,
            values,
            calldatas,
            description
        );

    }

   ```
### Voting status query validation function
   ```
   function fetchVotingStatus(bytes memory response, IWormhole.Signature[] memory signatures) internal view returns(bool){
        bool votedAlready = false;
        ParsedQueryResponse memory r = parseAndVerifyQueryResponse(response, signatures);
        uint256 numResponses = r.responses.length;
        if (numResponses != _noOfChains) {
            revert UnexpectedResultMismatch(1);
        }

        for (uint256 i = 0; i < numResponses;) {

            EthCallQueryResponse memory eqr = parseEthCallQueryResponse(r.responses[i]);

            // Validate that update is not stale
            validateBlockTime(eqr.blockTime, block.timestamp - 300);

            if (eqr.result.length != 1) {
                revert UnexpectedResultMismatch(2);
            }

            // Validate addresses and function signatures
            address[] memory validAddresses = new address[](1);
            bytes4[] memory validFunctionSignatures = new bytes4[](1);
            validAddresses[0] = address(this);
            validFunctionSignatures[0] = hasVotedSelector;

            validateMultipleEthCallData(eqr.result, validAddresses, validFunctionSignatures);

            if(eqr.result[0].result.length != 32){
                revert UnexpectedResultMismatch(3);
            }

            votedAlready = abi.decode(eqr.result[0].result, (bool)) == true? true : votedAlready;

            unchecked {
                ++i;
            }
        }

        return votedAlready;

    }
   ```
### Vote count aggregation through query
   ```
   function fetchVotesFromSpokes(bytes memory response, IWormhole.Signature[] memory signatures, uint256 proposalId) internal  {
        uint256 againstCount;
        uint256 forCount;
        uint256 abstainCount;

        ParsedQueryResponse memory r = parseAndVerifyQueryResponse(response, signatures);
        uint256 numResponses = r.responses.length;
        if (numResponses != spokePeerIds.length) {
            revert UnexpectedResultMismatch(1);
        }

        for (uint256 i = 0; i < numResponses;) {

            EthCallQueryResponse memory eqr = parseEthCallQueryResponse(r.responses[i]);

            // Validate that update is not stale
            validateBlockTime(eqr.blockTime, block.timestamp - 300);

            if (eqr.result.length != 1) {
                revert UnexpectedResultMismatch(2);
            }

            // Validate addresses and function signatures
            address[] memory validAddresses = new address[](1);
            bytes4[] memory validFunctionSignatures = new bytes4[](1);
            validAddresses[0] = address(this);
            validFunctionSignatures[0] = proposalVotesSelector;

            validateMultipleEthCallData(eqr.result, validAddresses, validFunctionSignatures);

            if(eqr.result[0].result.length != 32){
                revert UnexpectedResultMismatch(3);
            }

            (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = abi.decode(eqr.result[0].result, (uint256, uint256, uint256));

            againstCount += againstVotes;
            forCount += forVotes;
            abstainCount += abstainVotes;

            unchecked {
                ++i;
            }
        }

        _countVote(proposalId, address(1), 0, againstCount,"");
        _countVote(proposalId, address(2), 1, forCount,"");
        _countVote(proposalId, address(3), 2, abstainCount,"");

    }
   ```

## Steps to deploy

1. Deploy veBuds
  ```
    npx hardhat deploy-vebuds --network $NETWORK_NAME --chain $NETWORK_NAME
  ```

2. Deploy timelock
   ```
    npx hardhat deploy-timelock --network $NETWORK_NAME --chain $NETWORK_NAME --mindelay $MINIMUM_EXECUTION_DELAY --admin $ADMIN_ADDRESS
   ```
   
3. Deploy Hub DAO contract
   ```
    npx hardhat deploy-hub-dao \
    --chain $NETWORK_NAME
    --network $NETWORK_NAME
    --token $VEBUDS_TOKEN_ADDRESS
    --timelock $TIMELOCK_ADDRESS
    --relayer $WORMHOLE_RELAYER_ADDRESS_FOR_CUR_CHAIN
    --chaindids $ARRAY_OF_SPOKE_CHAIN_IDS_IN_WORMHOLE_FORMAT [optional]
   ```
   
4. Deploy Spoke DAO contract
   ```
    npx hardhat deploy-spoke-dao \
    --network $NETWORK_NAME
    --chain $NETWORK_NAME
    --token $VEBUDS_TOKEN_ADDRESS
    --timelock $TIMELOCK_ADDRESS
    --relayer $WORMHOLE_RELAYER_ADDRESS_FOR_CUR_CHAIN
    --hub $HUB_CONTRACT_ADDRESS_FROM_HUB_CHAIM
    --chainid $CHAINID_OF_CUR_CHAIN_IN_WORHMHOLE_FORMAT
    --hubchainid $CHAINID_OF_HUB_CHAIN_IN_WORHMHOLE_FORMAT
    --chains $NUMBER_OF_CHAINS_WHERE_DAO_IS_LIVE
   ```
   
5. Creating proposal
  ```
  npx hardhat create-proposal \
  --contract <BakelandDAOHub contract address> \
  --targets '["<target_address1>", "<target_address2>"]' \
  --values '[0, 0]' \
  --calldatas '["0x", "0x"]' \
  --description "My new governance proposal"

  ```

6. Voting on proposal
  ```
  npx hardhat cast-vote \
    --contract <BakelandDAOHub contract address> \
    --proposalid <proposal_id> \
    --support <0/1/2> \
    --response "<response_data>" \
    --signatures '[<signature1>, <signature2>]'

  ```

7. Executing
   ```
   npx hardhat execute-proposal \
    --contract <BakelandDAOHub contract address> \
    --targets '["<target_address1>", "<target_address2>"]' \
    --values '[0, 0]' \
    --calldatas '["0x", "0x"]' \
    --descriptionhash "<description_hash>" \
    --response "<response_data>" \
    --signatures '[<signature1>, <signature2>]'

   ``` 
