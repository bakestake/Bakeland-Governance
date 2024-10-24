// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {TimelockControllerUpgradeable} from '@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol';

contract Timelock is TimelockControllerUpgradeable {
    
    function initialize_timelock(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin) public initializer {
        __TimelockController_init(minDelay, proposers, executors, admin);
    }

}