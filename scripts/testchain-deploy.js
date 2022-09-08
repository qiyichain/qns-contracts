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


const DAYS = 24 * 60 * 60
const REGISTRATION_TIME = 28 * DAYS
const BUFFERED_REGISTRATION_COST = 1000;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const EMPTY_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const COST = 1000


async function main() {
    let signers = await ethers.getSigners()
    let ownerAccount = await signers[0].getAddress()
    let accounts = [ownerAccount, ownerAccount, ownerAccount]

    qns = await deploy('QNSRegistry' )
    console.log('QNSRegistry:', qns.address)
    console.log("==================1111111======================")

    baseRegistrar = await deploy(
        'BaseRegistrarImplementation',
        qns.address,
        namehash.hash('qy'),
        "Qiyichain Name Service",
        "QNS",
        "https://qns.qiyichain/nft/",
    )

    console.log("BaseRegistrarImplementation:",  baseRegistrar.address)

    console.log("==================22222222======================")

    let resolver = await deploy(
        'PublicResolver',
        qns.address,
    )
    console.log("PublicResolver:", resolver.address)
    console.log("==================3333333======================")


    let reverseRegistrar = await deploy('ReverseRegistrar', qns.address, resolver.address, {gasLimit: 15000000})
    console.log("ReverseRegistrar:", reverseRegistrar.address)
    console.log("==================4444444======================")

    let tx = await qns.setSubnodeOwner(EMPTY_BYTES, sha3('qy'), baseRegistrar.address)
    console.log("init root node tx : ", (await tx.wait()).status )
    console.log("==================555555======================")


    let controller = await deploy(
        'QYRegistrarController',
        baseRegistrar.address,
        resolver.address,
        10,
        1000,
    )
    console.log("QYRegistrarController:", controller.address)
    console.log("==================6666666======================")

    // let controller2 = controller.connect(signers[1])
    await baseRegistrar.addController(controller.address)
    await reverseRegistrar.setController(controller.address, true)

    console.log("==================777777======================")

    // let resolver2 = await resolver.connect(signers[1])
    console.log("==================888888======================")

    await qns.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), accounts[0], {
    from: accounts[0],
    })
    console.log("==================99999======================")
    await qns.setSubnodeOwner(
        namehash.hash('reverse'),
        sha3('addr'),
        reverseRegistrar.address,
        { from: accounts[0] }
    )

}




// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
