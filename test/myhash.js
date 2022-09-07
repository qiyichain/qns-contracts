
const namehash = require('eth-ens-namehash')

const sha3 = require('web3-utils').sha3
const keccak256 = require('web3-utils').keccak256
const toBN = require('web3-utils').toBN

// ethhash = namehash.hash('bnb')
// console.log(ethhash)
// 0xdba5666821b22671387fe7ea11d7cc41ede85a5aa67c3e7b3d68ce6a661f389c


ethhash = namehash.hash('qy')
console.log(ethhash)
// 0x89f9fa7dfb2063d526ebb3ca370e91a9a03cb631cf6aef2d77a9f61a2c1788fb


// calculate  COMMITMENT_CONTROLLER_ID in /qyregistrar/QYRegistrarController.sol
controller_id = toBN(keccak256("rentPrice(string,uint256)"))
    .xor(toBN(keccak256("available(string)")))
    .xor(toBN(keccak256("makeCommitment(string,address,bytes32)")))
    .xor(toBN(keccak256("commit(bytes32)")))
    .xor(toBN(keccak256("register(string,address,uint256,bytes32)")))
    .xor(toBN(keccak256("renew(string,uint256)")))
    .toString("hex", 64)
console.log( "0x" + controller_id.substring(0, 8)) // 0x018fac06
