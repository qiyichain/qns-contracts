//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import "../registry/QNS.sol";
import "./QYRegistrarController.sol";
import "../resolvers/Resolver.sol";


contract BatchRenew {
    bytes32 constant private QY_NAMEHASH = 0x89f9fa7dfb2063d526ebb3ca370e91a9a03cb631cf6aef2d77a9f61a2c1788fb;
    bytes4 constant private REGISTRAR_CONTROLLER_ID = 0x018fac06;
    bytes4 constant private INTERFACE_META_ID = bytes4(keccak256("supportsInterface(bytes4)"));
    bytes4 constant public BULK_RENEWAL_ID = bytes4(
        keccak256("rentPrice(string[],uint)") ^
        keccak256("renewAll(string[],uint")
    );

    QNS public qns;

    constructor(QNS _qns)  {
        qns = _qns;
    }

    function getController() public view returns(QYRegistrarController) {
        Resolver r = Resolver(qns.resolver(QY_NAMEHASH));
        return QYRegistrarController(r.interfaceImplementer(QY_NAMEHASH, REGISTRAR_CONTROLLER_ID));
    }

    function rentPrice(string[] calldata names, uint duration) external view returns(uint) {
        QYRegistrarController controller = getController();
        uint total = 0;
        for(uint i = 0; i < names.length; i++) {
            total += controller.rentPrice(names[i], duration);
        }
        return total;
    }

    function renewAll(string[] calldata names, uint duration) external payable {
        QYRegistrarController controller = getController();
        for(uint i = 0; i < names.length; i++) {
            uint cost = controller.rentPrice(names[i], duration);
            controller.renew{value:cost}(names[i], duration);
        }
        // Send any excess funds back
        payable(msg.sender).transfer(address(this).balance);
    }

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
         return interfaceID == INTERFACE_META_ID || interfaceID == BULK_RENEWAL_ID;
    }
}
