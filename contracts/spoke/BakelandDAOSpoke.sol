// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "wormhole-solidity-sdk/interfaces/IWormholeRelayer.sol";
import "wormhole-solidity-sdk/interfaces/IWormholeReceiver.sol";
import "wormhole-solidity-sdk/interfaces/IWormhole.sol";
import {QueryResponse} from "../wormholeQuery/QueryResponse.sol";


contract BakelandDAOHub is 
    Initializable, 
    GovernorUpgradeable, 
    GovernorSettingsUpgradeable, 
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable, 
    GovernorVotesQuorumFractionUpgradeable, 
    GovernorTimelockControlUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable,
    IWormholeReceiver,
    QueryResponse
{

    error InvalidSender();
    error InvalidRelayer();
    error InvalidVaa(string);
    error InvalidReceiverChainId();
    error InvalidReceiverAddress();
    error ReplayCcmDetected();
    error UnexpectedResultMismatch(uint);

    IWormholeRelayer public _wormhole;

    uint16 public _chainId;
    uint16 public _hubChainId;
    uint16 public _noOfChains;

    bytes32 public _hubAddress;
    bytes4 public hasVotedSelector;
    
    mapping (bytes32 ccmHash => bool) replayGuard;
        
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token, 
        address _timelock, 
        address _wormholeRelayer,
        bytes32 _hubDaoContract, 
        uint16 _curChainId, 
        uint16 hubChainId,
        uint16 noOfChains
    )
        initializer public
    {
        
        _hubChainId = hubChainId;
        _chainId = _curChainId;
        _noOfChains = noOfChains;

        _hubAddress = _hubDaoContract;
        _wormhole = IWormholeRelayer(_wormholeRelayer);
        hasVotedSelector = bytes4(hex'43859632');

        __Governor_init("Bakeland-Hub");
        __GovernorSettings_init(1 days, 1 weeks, 0);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotes(_token));
        __GovernorVotesQuorumFraction_init(10);
        __GovernorTimelockControl_init(TimelockControllerUpgradeable(payable(_timelock)));
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function changeHubAddress(bytes32 newHubContractAddress) external onlyOwner{
        _hubAddress = newHubContractAddress;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override pure returns (uint256) {
        revert();
    }

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

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

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
}
