//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract DummyProxyRegistry {
    address target;

    constructor(address _target)  {
        target = _target;
    }

    function proxies(address a_) external view returns(address) {
        if (a_ == target) {
            return a_;
        }

        return target;
    }
}
