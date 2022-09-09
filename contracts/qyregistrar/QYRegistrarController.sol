//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BaseRegistrarImplementation.sol";
import "../utils/StringUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../resolvers/Resolver.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract QYRegistrarController is Ownable {
    using StringUtils for *;
    using SafeMath for uint256;

    uint256 private _baseRentPrice  = 1 ether;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;

    bytes4 private constant INTERFACE_META_ID =
        bytes4(keccak256("supportsInterface(bytes4)"));

    // 0x523d5854
    bytes4 private constant CONTROLLER_ID = bytes4(
            keccak256("rentPrice(string,uint256)") ^
                keccak256("available(string)") ^
                keccak256("register(string,address,uint256)") ^
                keccak256("renew(string,uint256)")
        );

    BaseRegistrarImplementation public base;
    address public defaultResolver;

    mapping(bytes32 => uint256) public commitments;

    bool isPublicRegister = true;
    mapping(address => bool) managers;

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

    constructor(
        BaseRegistrarImplementation _base,
        Resolver _defaultResolver
    )  {
        base = _base;
        defaultResolver = address(_defaultResolver);
        require(defaultResolver != address(0), "default resolve must be publicresolver");
    }

    modifier onlyManager() {
        if (!isPublicRegister) {
            require(owner() == msg.sender || managers[msg.sender], "caller is not the manager");
        }
        _;
    }

    function setPublicRegister(bool status) public onlyOwner{
        isPublicRegister = status;
    }

    function addManager(address addr_) public onlyOwner {
        managers[addr_] = true;
    }

    function removeManager(address addr_) public onlyOwner {
        if (managers[addr_]) {
            delete managers[addr_];
        }
    }

    function setBaseRentPrice(uint256 _basePrice) public onlyOwner {
        require(_basePrice > 0, "_basePrice must greater than 0");
        _baseRentPrice = _basePrice;
    }

    function rentPrice(string memory name_, uint256 duration_)
        public
        view
        returns (uint256)
    {
        uint256 len = name_.strlen();
        if (len == 1 && duration_ >= MIN_REGISTRATION_DURATION) {
            return _baseRentPrice.mul(1000); // 1000 * baseRentPrice
        }
        return _baseRentPrice;
    }

    function check(string memory name) public pure returns (bool) {
        bytes memory namebytes = bytes(name);

        for (uint256 i; i < namebytes.length; i++) {
            if (!exists(bytes1(namebytes[i]))) return false;
        }
        return true;
    }

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() > 0 && check(name);
    }

    function available(string memory name) public view returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }


    function exists(bytes1 char) public pure returns (bool) {
        bytes memory charsets = bytes("abcdefghigklmnopqrstuvwxyz-0123456789");
        for (uint256 i = 0; i < charsets.length; i++) {
            if (bytes1(charsets[i]) == char) {
                return true;
            }
        }
        return false;
    }

    function register(
        string memory name,
        address owner,
        uint256 duration
    ) external payable onlyManager  {
        require(owner != address(0), "owner must not be 0");

        // set defaultResolver as default resolver
        // resolve to owner as default
        address resolver = defaultResolver;
        address addr = owner;

        require(available(name), "Name not available");
        uint256 cost = rentPrice(name, duration);
        require(duration >= MIN_REGISTRATION_DURATION, "Duration too short");
        require(msg.value >= cost, "Not enough payment");

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
        base.qns().setResolver(nodehash, resolver);

        // Configure the resolver
        if (addr != address(0)) {
            Resolver(resolver).setAddr(nodehash, addr);
        }

        // Now transfer full ownership to the expeceted owner
        base.reclaim(tokenId, owner);
        base.transferFrom(address(this), owner, tokenId);

        emit NameRegistered(name, label, owner, cost, expires);

        // note(yqq): 2022-09-08
        // DON'T refund any extra payment, as this contract is not in B-end whitelist
        // if (msg.value > cost) {
        //     payable(msg.sender).transfer(msg.value - cost);
        // }
    }

    function renew(string calldata name, uint256 duration) external payable {
        uint256 cost = rentPrice(name, duration);
        require(msg.value >= cost, "not enough payments");

        bytes32 label = keccak256(bytes(name));
        uint256 expires = base.renew(uint256(label), duration);

        // DO NOT REFUNDS, 2022-09-09
        // if (msg.value > cost) {
        //     payable(msg.sender).transfer(msg.value - cost);
        // }

        emit NameRenewed(name, label, cost, expires);
    }


    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function supportsInterface(bytes4 interfaceID)
        external
        pure
        returns (bool)
    {
        return interfaceID == INTERFACE_META_ID || interfaceID == CONTROLLER_ID;
    }
}
