
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


// calculate  CONTROLLER_ID in /qyregistrar/QYRegistrarController.sol
controller_id = toBN(keccak256("rentPrice(string,uint256)"))
    .xor(toBN(keccak256("available(string)")))
    .xor(toBN(keccak256("register(string,address,uint256)")))
    .xor(toBN(keccak256("renew(string,uint256)")))
    .toString("hex", 64)
console.log( "0x" + controller_id.substring(0, 8))
// 0x523d5854


bnbhash = namehash.hash('bnb')
console.log(bnbhash)
// 0xdba5666821b22671387fe7ea11d7cc41ede85a5aa67c3e7b3d68ce6a661f389c



console.log(keccak256('bnb'))
// 0x84f284b8f96a449a73a2abd6faa45f5180a36ce1925ba9b4c9683ccaa3d1178d



console.log(keccak256('qy'))
// 0x89395a1dc614a5b08fcbf8037efcc697e2a8cd0749df7ab3aad553702e3a9a19

console.log( namehash.hash('tt') )
// 0x6c138ef22c3aed80723cfd7c1f7ff1447f5325db0ed1ddf9473d2ef6e7457cc9

console.log( keccak256('tt') )
// 0xb32b447303e7d7054aa7e4474cd1e74f976743b15ebf37419c077758d2ec094a

console.log( namehash.hash('tt.qy'))
// 0x080f7a9ca6b8e319b581ee3e23f8766587c02a7aab1705f55ade43b26309ba3c

console.log( namehash.hash('yqq.qy'))
// 0x157c2cee815e95cd8cd51edd82ca658f0a04528483bc498230b0cd1441145d8c

console.log( keccak256('yqq'))
// 0xf93815d1586a918dc3174d3a76c0aff3a86b4b15f11d5af3a80b4ec3523e1eac


console.log( namehash.hash('addr.reverse'))
// 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2

console.log( namehash.hash('0x8284b6412ef6efa75addea85f07e7de5f8f8ec48.addr.reverse'))
// 0x4909a5a6a209c0ef11d085eb9f6468ea73c825ef261c42071b73c58b06999bdc


console.log( namehash.hash('0x8284B6412ef6eFA75adDEa85f07E7de5f8F8ec48.addr.reverse'))
// 0x4909a5a6a209c0ef11d085eb9f6468ea73c825ef261c42071b73c58b06999bdc

function getReverseNode(addr) {
    return namehash.hash(addr.slice(2).toLowerCase() + '.addr.reverse')
}

console.log( getReverseNode('0x8284B6412ef6eFA75adDEa85f07E7de5f8F8ec48') )
// 0x1aadb2b88c9e3035aad51311163fcfb74aee29414756dc508264591559c7ebcc