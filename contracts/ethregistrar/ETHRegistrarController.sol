//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BaseRegistrarImplementation.sol";
import "./StringUtils.sol";
import "../resolvers/Resolver.sol";
import "../registry/ReverseRegistrar.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../wrapper/INameWrapper.sol";

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract ETHRegistrarController is Ownable  {
    using StringUtils for *;
    using Address for address;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    bytes32 private constant ETH_NODE =
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;


    bytes4 private constant INTERFACE_META_ID =
    bytes4(keccak256("supportsInterface(bytes4)"));
    bytes4 private constant COMMITMENT_CONTROLLER_ID =
        bytes4(
            keccak256("rentPrice(string,uint256)") ^
                keccak256("available(string)") ^
                keccak256("makeCommitment(string,address,bytes32)") ^
                keccak256("commit(bytes32)") ^
                keccak256("register(string,address,uint256,bytes32)") ^
                keccak256("renew(string,uint256)")
        );

    bytes4 private constant COMMITMENT_WITH_CONFIG_CONTROLLER_ID =
        bytes4(
            keccak256(
                "registerWithConfig(string,address,uint256,bytes32,address,address)"
            ) ^
                keccak256(
                    "makeCommitmentWithConfig(string,address,bytes32,address,address)"
                )
        );


    BaseRegistrarImplementation immutable base;
    uint256 public immutable minCommitmentAge;
    uint256 public immutable maxCommitmentAge;
    // ReverseRegistrar public immutable reverseRegistrar;
    // INameWrapper public immutable nameWrapper;

    mapping(bytes32 => uint256) public commitments;

    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 cost,
        uint256 expires
    );
    event NameRenewed(
        string name,
        bytes32 indexed label,
        uint256 cost,
        uint256 expires
    );
    event NewPriceOracle(address indexed oracle);

    constructor(
        BaseRegistrarImplementation _base,
        uint256 _minCommitmentAge,
        uint256 _maxCommitmentAge
    ) {
        require(_maxCommitmentAge > _minCommitmentAge);

        base = _base;
        minCommitmentAge = _minCommitmentAge;
        maxCommitmentAge = _maxCommitmentAge;
    }


    function rentPrice(string memory name, uint256 duration)
        public
        pure
        returns (uint256)
    {
        // bytes32 label = keccak256(bytes(name));
        // price = prices.price(name, base.nameExpires(uint256(label)), duration);

        // 2022-09-02(yqq), set retPrice as 1 ether,
        // so that only B-end address could call regiest method with payment
        return 1 ether;
    }

    function check(string memory name) public pure returns (bool) {
        bytes memory namebytes = bytes(name);

        for (uint256 i; i < namebytes.length; i++) {
            if (!exists(bytes1(namebytes[i]))) return false;
        }
        return true;
    }

    // 2022-09-02(yqq): disable
    function exists(bytes1 char) public pure returns (bool) {
        bytes memory charsets = bytes("abcdefghigklmnopqrstuvwxyz-0123456789");
        for (uint256 i = 0; i < charsets.length; i++) {
            if (bytes1(charsets[i]) == char) {
                return true;
            }
        }
        return false;
    }

    // 2022-09-2(yqq): ens min length is 3, we set as 1
    function valid(string memory name) public pure returns (bool) {
        return name.strlen() > 0 && check(name);
    }

    function available(string memory name) public view  returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }


    function commit(bytes32 commitment) public  {
        require(commitments[commitment] + maxCommitmentAge < block.timestamp);
        commitments[commitment] = block.timestamp;
    }

    function register(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret
    ) external payable {
        registerWithConfig(
            name,
            owner,
            duration,
            secret,
            address(0),
            address(0)
        );
    }

    function registerWithConfig(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        address addr
    ) public payable {

        // 2022-09-02 must set resolver when register
        // use public resolver as default
        require(resolver != address(0), "resolver cannot be empty");

        bytes32 commitment = makeCommitmentWithConfig(
            name,
            owner,
            secret,
            resolver,
            addr
        );
        uint256 cost = _consumeCommitment(name, duration, commitment);

        bytes32 label = keccak256(bytes(name));
        uint256 tokenId = uint256(label);

        uint256 expires;
        // Set this contract as the (temporary) owner, giving it
        // permission to set up the resolver.
        expires = base.register(tokenId, address(this), duration);

        // The nodehash of this label
        bytes32 nodehash = keccak256(
            abi.encodePacked(base.baseNode(), label)
        );

        // Set the resolver
        base.ens().setResolver(nodehash, resolver);

        // Configure the resolver
        if (addr != address(0)) {
            Resolver(resolver).setAddr(nodehash, addr);
        }

        // Now transfer full ownership to the expeceted owner
        base.reclaim(tokenId, owner);
        base.transferFrom(address(this), owner, tokenId);
        emit NameRegistered(name, label, owner, cost, expires);

        // Refund any extra payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function makeCommitment(
        string memory name,
        address owner,
        bytes32 secret
    ) public pure returns (bytes32) {
        return
            makeCommitmentWithConfig(
                name,
                owner,
                secret,
                address(0),
                address(0)
            );
    }

    function makeCommitmentWithConfig(
        string memory name,
        address owner,
        bytes32 secret,
        address resolver,
        address addr
    ) public pure returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        if (resolver == address(0) && addr == address(0)) {
            return keccak256(abi.encodePacked(label, owner, secret));
        }
        require(resolver != address(0));
        return
            keccak256(abi.encodePacked(label, owner, resolver, addr, secret));
    }

     function renew(string calldata name, uint256 duration) external payable {
        uint256 cost = rentPrice(name, duration);
        require(msg.value >= cost);

        bytes32 label = keccak256(bytes(name));
        uint256 expires = base.renew(uint256(label), duration);

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit NameRenewed(name, label, cost, expires);
    }

    function withdraw() public {
        payable(owner()).transfer(address(this).balance);
    }

    function supportsInterface(bytes4 interfaceID)
        external
        pure
        returns (bool)
    {
        return
            interfaceID == INTERFACE_META_ID ||
            interfaceID == COMMITMENT_CONTROLLER_ID ||
            interfaceID == COMMITMENT_WITH_CONFIG_CONTROLLER_ID;
    }

    /* Internal functions */

    function _consumeCommitment(
        string memory name,
        uint256 duration,
        bytes32 commitment
    ) internal returns (uint256) {
        // Require a valid commitment
        require(commitments[commitment] + minCommitmentAge <= block.timestamp, "Require a valid commitment");

        // If the commitment is too old, or the name is registered, stop
        require(commitments[commitment] + maxCommitmentAge > block.timestamp, "Commitment is too old, or the name is registered");
        require(available(name), "Name not available");

        delete (commitments[commitment]);

        uint256  cost = rentPrice(name, duration);
        require(duration >= MIN_REGISTRATION_DURATION, "Duration too short");
        require(msg.value >= cost, "Not enough payment");

        return cost;
    }

}
