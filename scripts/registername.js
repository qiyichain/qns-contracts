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
const EMPTY_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const COST = 1000

function mysleep(ms) {
    return new Promise(resolve => setTimeout(() =>resolve(), ms));
};

async function registerName( controller , name, owner,
    txOptions = { value: BUFFERED_REGISTRATION_COST }
) {

    // const secret = '0x' + (crypto.randomBytes(32)).toString("hex")
    const secret = '0x1000000000000000000000000000000000000000000000000000000000000001'

    var commitment = await controller.makeCommitment(
        name,
        owner,
        secret,
    )
    var tx = await controller.commit(commitment)
    // expect(await controller.commitments(commitment)).to.equal(
    //     (await provider.getBlock(tx.blockNumber)).timestamp
    // )

    // sleep 30s to exceed minCommitmentAge
    await mysleep(30 * 1000)

    var tx = await controller.register(
        name,
        owner,
        REGISTRATION_TIME,
        secret,
        txOptions
    )

    return tx
}



async function main() {
    // let rnd  = Math.random().toString(16).substring(2)
    // console.log("rnd is ", rnd)
    // crypto.randomBytes(32).toString()
    // console.log( (crypto.randomBytes(32)).toString("hex") )


    let registrarControllerAddr = "0xC3D5d8B9f041ca3CA174675744b496AADeB312de"
    let controller = await ethers.getContractAt("QYRegistrarController", registrarControllerAddr)

    let signers = await ethers.getSigners()
    let ownerAccount = await signers[0].getAddress()
    let tx = await registerName(controller, "yqq", ownerAccount)

    console.log(tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });