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
    QueryResponse
{
    error UnexpectedResultMismatch(uint);

    /// Wormhole relayer interface for cross chain messaging
    IWormholeRelayer public _wormhole;

    /// Array of spoke chains peer ids
    uint16[] public spokePeerIds;

    /// Function selectors for queries
    bytes4 public proposalVotesSelector;
    bytes4 public hasVotedSelector;
    
    /// Spoke chain ids to corresponding contract address mapping 
    mapping(uint16 id => address spokeAddress) spokeAddresseBychainId;


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }   


    /// @param _token Token address of veBuds[ERC20Votes]
    /// @param _timelock Timelock contract address
    /// @param _wormholeRelayer Relayer address 
    /// @param chainIds spoke chain ids
    function initialize(
        address _token,
        address _timelock,
        address _wormholeRelayer,
        uint16[] memory chainIds
    ) public initializer {
        _wormhole = IWormholeRelayer(_wormholeRelayer);
        proposalVotesSelector = bytes4(hex'544ffc9c');
        hasVotedSelector = bytes4(hex'43859632');

        __Governor_init("Bakeland-Hub");
        __GovernorSettings_init(1 days, 1 weeks, 0);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotes(_token));
        __GovernorVotesQuorumFraction_init(10);
        __GovernorTimelockControl_init(
            TimelockControllerUpgradeable(payable(_timelock))
        );
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        for(uint i = 0; i < chainIds.length; i++){
            spokePeerIds.push(chainIds[i]);
        }
    }

    /// This function is responsible for adding new spoke chains
    /// @param chainIds Array of chain ids to add
    /// @param peerAddresses Corresponding contract address to each chain id
    function addNewPeers(uint16[] memory chainIds, address[] memory peerAddresses) external onlyOwner{
        require(chainIds.length == peerAddresses.length);
        for(uint i = 0; i < chainIds.length; i++){
            spokePeerIds.push(chainIds[i]);
            spokeAddresseBychainId[chainIds[i]] = peerAddresses[i];
        }
    }

    /// This function is responsible for updating exisiting spoke chain contract address
    /// @param chainIds Array of chain ids to add
    /// @param peerAddresses Corresponding contract address to each chain id
    function updatePeerAddresses(uint16[] memory chainIds, address[] memory peerAddresses) external onlyOwner{
        require(chainIds.length == peerAddresses.length);
        for(uint i = 0; i < chainIds.length; i++){
            spokeAddresseBychainId[chainIds[i]] = peerAddresses[i];
        }
    }


    /// Overloaded execute function
    /// This function accepts following two parameters for aggregating votes from spoke chains and
    /// updating vote count on hub before executing
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash,
        bytes memory response, 
        IWormhole.Signature[] memory signatures
    ) public payable returns (uint256){
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        fetchVotesFromSpokes(response, signatures, proposalId);
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    function quoteCrossChainCost() public view returns (uint256 cost) {
        for (uint i = 0; i < spokePeerIds.length; i++) {
            uint256 curCost;
            (curCost, ) = _wormhole.quoteEVMDeliveryPrice(
                spokePeerIds[i],
                0,
                2_500_000
            );
            cost += curCost;
        }
    }

    /// Create proposal function with publishing data to spoke chains, This function creates the proposal 
    /// on hub chain first and publishes message to spoke chains to create a proposal with same data on 
    /// spoke chains
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


    /// Function responsible to process the query response
    /// it parse the response from query and updates vote state on hub
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

    /// This function is responsible for parsing the query response and validating if
    /// user has casted vote on any other spoke akready
    function fetchVotingStatus(bytes memory response, IWormhole.Signature[] memory signatures) internal view returns(bool){
        bool votedAlready = false;
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

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(
        uint256 proposalId
    )
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    )
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

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint48)
    {
        return
            super._queueOperations(
                proposalId,
                targets,
                values,
                calldatas,
                descriptionHash
            );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
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

    /// override execute function
    /// Overriden to avoid being used without query validation
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256){
        revert();
    }

    //-------------------------------------------------------------------------------------------------------//
    /// Overriden original cast vote functions to avoid anyone from making use of the to caste vote
    /// as these do not validate if the user has already voted on any other spoke chain or not.

    function castVote(uint256 proposalId, uint8 support) public pure override returns (uint256) {
        revert();
    }
    /**
     * @dev See {IGovernor-castVoteWithReason}.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public pure override returns (uint256) {
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
    ) public pure override returns (uint256) {
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
    ) public pure override returns (uint256) {
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
    ) public pure override returns (uint256) {
        revert();
    }


    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
