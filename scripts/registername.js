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

async function registerName( controller , name, owner,
    txOptions = { value: BUFFERED_REGISTRATION_COST }
) {
    var tx = await controller.register(
        name,
        owner,
        REGISTRATION_TIME,
        txOptions
    )

    return tx
}



async function main() {

    // QYRegistrarController deployed contract address
    let registrarControllerAddr = "0x3d1D3B7c5B87a283425964665536acd0d2298570"
    let controller = await ethers.getContractAt("QYRegistrarController", registrarControllerAddr)

    let signers = await ethers.getSigners()
    let ownerAccount = await signers[0].getAddress()

    let label = "yqq"
    let ok = await controller.available(label)
    if( !ok ) {
        console.log("😱 This is label ", label, " is already be registed.")
        return
    }

    let tx = await registerName(controller, label, ownerAccount)
    if(1 == (await tx.wait().status) ) {
        console.log("✅ register ", "."+label, " successfully")
    } else {
        console.log("😱 register ", "."+label, " failed")

        // const trace = await provider.send("debug_traceTransaction", [
        //     "0xcf63f210f9ad0d46246415b4c7c7ba1cbabf34e6d1393d59781e40e74c3a6971"
        // ])
        // console.log(trace)
    }
    console.log("register name tx hash is : ", tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});