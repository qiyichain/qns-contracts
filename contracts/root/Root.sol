//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../registry/QNS.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Controllable.sol";

contract Root is Ownable, Controllable {
    bytes32 private constant ROOT_NODE = bytes32(0);

    bytes4 private constant INTERFACE_META_ID =
        bytes4(keccak256("supportsInterface(bytes4)"));

    event TLDLocked(bytes32 indexed label);

    QNS public qns;
    mapping(bytes32 => bool) public locked;

    constructor(QNS _qns)  {
        qns = _qns;
    }

    function setSubnodeOwner(bytes32 label, address owner)
        external
        onlyController
    {
        require(!locked[label]);
        qns.setSubnodeOwner(ROOT_NODE, label, owner);
    }

    function setResolver(address resolver) external onlyOwner {
        qns.setResolver(ROOT_NODE, resolver);
    }

    function lock(bytes32 label) external onlyOwner {
        emit TLDLocked(label);
        locked[label] = true;
    }

    function supportsInterface(bytes4 interfaceID)
        external
        pure
        returns (bool)
    {
        return interfaceID == INTERFACE_META_ID;
    }
}
