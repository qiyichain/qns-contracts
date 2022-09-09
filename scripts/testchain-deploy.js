const {
    evm,
    reverse: { getReverseNode },
    contracts: { deploy },
  } = require('../test/test-utils')

const { ethers } = require('hardhat')
const provider = ethers.provider
const namehash = require('eth-ens-namehash')
const { toUnicode } = require('punycode')
const sha3 = require('web3-utils').sha3
const toWei = require('web3-utils').toWei

// const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_ROOT_NODE = '0x0000000000000000000000000000000000000000000000000000000000000000'

async function main() {
    let signers = await ethers.getSigners()
    let ownerAccount = await signers[0].getAddress()
    let accounts = [ownerAccount, ownerAccount, ownerAccount]

    qns = await deploy('QNSRegistry' )
    console.log("✅ QNSRegistry deployed successfully!")

    baseRegistrar = await deploy(
        'BaseRegistrarImplementation',
        qns.address,
        namehash.hash('qy'),
        "Qiyichain Name Service",
        "QNS",
        "https://qns.qiyichain/nft/",
    )

    console.log("✅ BaseRegistrarImplementation.sol deployed successfully!")

    let resolver = await deploy(
        'PublicResolver',
        qns.address,
    )
    console.log("✅ PublicResolver.sol deployed successfully!")

    let reverseRegistrar = await deploy('ReverseRegistrar', qns.address, resolver.address, {gasLimit: 15000000})
    console.log("✅ ReverseRegistrar.sol deployed successfully!")

    let tx = await qns.setSubnodeOwner(ZERO_ROOT_NODE, sha3('qy'), baseRegistrar.address)
    if( 1 == (await tx.wait()).status ) {
        console.log("✅ setSubnodeOwner node (qy) successfully!")
    } else {
        console.log("😱 setSubnodeOwner failed!")
    }


    let controller = await deploy(
        'QYRegistrarController',
        baseRegistrar.address,
        resolver.address
    )
    console.log("✅ QYRegistrarController.sol deployed successfully!")

    await baseRegistrar.addController(controller.address)
    console.log("✅ baseRegistrar.addController successfully!")
    await reverseRegistrar.setController(controller.address, true)
    console.log("✅ reverseRegistrar.setController successfully!")

    await qns.setSubnodeOwner(ZERO_ROOT_NODE, sha3('reverse'), accounts[0], {
        from: accounts[0],
    })
    console.log("✅ qns.setSubnodeOwner root node (reverse) successfully!")

    await qns.setSubnodeOwner(
        namehash.hash('reverse'),
        sha3('addr'),
        reverseRegistrar.address,
        { from: accounts[0] }
    )
    console.log("✅ qns.setSubnodeOwner reverse root node (addr.reverse) successfully!")

    console.log("============================================")
    console.log("👇👇👇👇 All contract deployed successfully!")
    console.log("")
    console.log('QNSRegistry:', qns.address)
    console.log("BaseRegistrarImplementation:",  baseRegistrar.address)
    console.log("PublicResolver:", resolver.address)
    console.log("ReverseRegistrar:", reverseRegistrar.address)
    console.log("QYRegistrarController:", controller.address)

}




// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
