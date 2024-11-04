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


contract BakelandDAOSpoke is 
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

    /// Wormhole relayer interface for cross chain messaging
    IWormholeRelayer public _wormhole;

    /// Chain Id of chain where this contract is deployed at
    uint16 public _chainId;
    /// Chain Id of hub chain
    uint16 public _hubChainId;
    /// Number of chains where DAO is operational
    uint16 public _noOfChains;

    /// Address of hub contract 
    bytes32 public _hubAddress;
    /// Function selector of vote
    bytes4 public hasVotedSelector;
    /// Replay guard to record received ccm hash 
    mapping (bytes32 ccmHash => bool) replayGuard;
        
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param _token Token address of veBuds[ERC20Votes]
    /// @param _timelock Timelock contract address
    /// @param _wormholeRelayer Relayer address
    /// @param _hubDaoContract Hub contract address from hub chain
    /// @param _curChainId Chain id of chain where this contract is deployed at
    /// @param hubChainId Chain id of hub chain
    /// @param noOfChains Number of chains where DAO is operational
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

    /// @param newHubContractAddress Addres of contract from hub chain
    function changeHubAddress(bytes32 newHubContractAddress) external onlyOwner{
        _hubAddress = newHubContractAddress;
    }

    /// Function to receive cross chain message
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

     /// Overriding propose function to avoid invocation
    /// Proposals can only be created on hub chain
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override pure returns (uint256) {
        revert();
    }

    /// Overriding execute function to avoid invocation
    /// Execution can only be taken placed at hub chain
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256){
        revert();
    }

    /// Overloaded castVote functions ///

    /// These castVote function make call to the same internal function as original castVote functions
    /// Only difference is we add a validation condition to check if a user has already voted on any of
    /// spoke chains already.. If the user address has already casted vote on one of the spoke or the hub
    /// itself then user can cannot cast vote again

    function castVote(
        uint256 proposalId, 
        uint8 support,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public returns (uint256) {
        require(!fetchVotingStatus(response, signatures));
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @dev See {IGovernor-castVoteWithReason}.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public returns (uint256) {
        require(!fetchVotingStatus(response, signatures));
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason);
    }

    /**
     * @dev See {IGovernor-castVoteWithReasonAndParams}.
     */
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public returns (uint256) {
        require(!fetchVotingStatus(response, signatures));
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason, params);
    }

    /**
     * @dev See {IGovernor-castVoteBySig}.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public returns (uint256) {
        require(!fetchVotingStatus(response, signatures));
        bool valid = SignatureChecker.isValidSignatureNow(
            voter,
            _hashTypedDataV4(keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support, voter, _useNonce(voter)))),
            signature
        );

        if (!valid) {
            revert GovernorInvalidSignature(voter);
        }

        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @dev See {IGovernor-castVoteWithReasonAndParamsBySig}.
     */
    function castVoteWithReasonAndParamsBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string calldata reason,
        bytes memory params,
        bytes memory signature,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public returns (uint256) {
        require(!fetchVotingStatus(response, signatures));
        bool valid = SignatureChecker.isValidSignatureNow(
            voter,
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        EXTENDED_BALLOT_TYPEHASH,
                        proposalId,
                        support,
                        voter,
                        _useNonce(voter),
                        keccak256(bytes(reason)),
                        keccak256(params)
                    )
                )
            ),
            signature
        );

        if (!valid) {
            revert GovernorInvalidSignature(voter);
        }

        return _castVote(proposalId, voter, support, reason, params);
    }

    
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

    /// This function is responsible for parsing the query response and validating if
    /// user has casted vote on any other spoke akready
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

    /// Overriden original cast vote functions to avoid anyone from making use of the to caste vote
    /// as these do not validate if the user has already voted on any other spoke chain or not.

    function castVote(uint256 proposalId, uint8 support) public override returns (uint256) {
        revert();
    }
    /**
     * @dev See {IGovernor-castVoteWithReason}.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public override returns (uint256) {
        revert();
    }

    /**
     * @dev See {IGovernor-castVoteWithReasonAndParams}.
     */
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params
    ) public override returns (uint256) {
        revert();
    }

    /**
     * @dev See {IGovernor-castVoteBySig}.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) public override returns (uint256) {
        revert();
    }

    /**
     * @dev See {IGovernor-castVoteWithReasonAndParamsBySig}.
     */
    function castVoteWithReasonAndParamsBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string calldata reason,
        bytes memory params,
        bytes memory signature
    ) public override returns (uint256) {
        revert();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

}
