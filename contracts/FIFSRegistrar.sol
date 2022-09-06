//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./QNS.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract FIFSRegistrar {
    QNS qns;
    bytes32 rootNode;

    modifier only_owner(bytes32 label) {
        address currentOwner = qns.owner(keccak256(abi.encodePacked(rootNode, label)));
        require(currentOwner == address(0x0) || currentOwner == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param qnsAddr The address of the QNS registry.
     * @param node The node that this registrar administers.
     */
    constructor(QNS qnsAddr, bytes32 node)  {
        qns = qnsAddr;
        rootNode = node;
    }

    /**
     * Register a name, or change the owner of an existing registration.
     * @param label The hash of the label to register.
     * @param owner The address of the new owner.
     */
    function register(bytes32 label, address owner) public only_owner(label) {
        qns.setSubnodeOwner(rootNode, label, owner);
    }
}
