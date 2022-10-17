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

    // QYRegistrarController deployed contract address
    let registrarControllerAddr = "0x6aaf1274fEa4B4e849B21681e4871312eD8C8E0D"
    let controller = await ethers.getContractAt("QYRegistrarController", registrarControllerAddr)

    let signers = await ethers.getSigners()
    let owner = await signers[0].getAddress()

    // let labels = ["y", "yq", "yqq", "yqqq", "yqqqq", "yqqqqq", "yqqqqqq"]
    let labels = ["yqq"]

    for(let i = 0; i < labels.length; i++) {
        let label = labels[i]
        let ok = await controller.available(label)
        if( !ok ) {
            console.log("😱 This is label ", label, " is already be registed.")
            continue
        }

        let rentPrice  = controller.rentPrice(label, REGISTRATION_TIME)
        var tx = await controller.register(
            label,
            owner,
            REGISTRATION_TIME,
            {value: rentPrice}
        )

        // console.log(await tx)
        // console.log(await tx.wait())
        let txReceipt = await tx.wait()
        if(1 == txReceipt.status ) {
            console.log("✅ register ", label , " successfully")
        } else {
            console.log("😱 register ", label , " failed")
        }
        console.log("register name ", label, " tx hash is : ", tx.hash)
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});