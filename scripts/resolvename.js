const {
    evm,
    reverse: { getReverseNode },
    contracts: { deploy },
  } = require('../test/test-utils')

// const hre = require("hardhat");
const { ethers } = require('hardhat')
const provider = ethers.provider
const namehash = require('eth-ens-namehash')
const { toUnicode } = require('punycode')
const sha3 = require('web3-utils').sha3
const toWei = require('web3-utils').toWei

var crypto = require('crypto')
// const {randomBytes } = await import('crypto');

const DAYS = 24 * 60 * 60
const REGISTRATION_TIME = 28 * DAYS
const BUFFERED_REGISTRATION_COST = 1000;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000'

const COST = 1000
function mysleep(ms) {
    return new Promise(resolve => setTimeout(() =>resolve(), ms));
};


async function main() {

    // publicResolver deployed contract address
    let publicResolver = "0x70DD1D4c6a39076398DF59442f9403bf92aC99D0"
    let resolver = await ethers.getContractAt("PublicResolver", publicResolver)

    let signers = await ethers.getSigners()
    let owner = await signers[0].getAddress()

    let label = "yqq.qy"
    let node = namehash.hash(label)
    let a = await resolver.functions['addr(bytes32)'](node)
    console.log('根据' + label +'解析结果为: ' + a)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});