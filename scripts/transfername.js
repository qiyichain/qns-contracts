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

    // BaseRegistrarImplementation deployed contract address
    let baseRegistrar = await ethers.getContractAt("BaseRegistrarImplementation", "0x32299736326D3aC86da1de620fd15f2Dc390bbAD")
    let resolver = await ethers.getContractAt("PublicResolver", "0x70DD1D4c6a39076398DF59442f9403bf92aC99D0")
    let qns = await ethers.getContractAt("QNSRegistry", "0xf48E2c84971C3B7C0ca844117A9499161e601A06")

    let signers = await ethers.getSigners()
    let registrantAccount = await signers[0]
    let registrantAddress = await registrantAccount.getAddress()
    let otherAccount = await signers[1]
    let otherAddress = await otherAccount.getAddress()

    console.log("otherAddress is " + otherAddress)

    // 转手续费
    // await signers[0].sendTransaction({
    //    to: otherAddress,
    //    value: ethers.utils.parseEther("11"), // 500亿
    //     }
    // )

    let label = "yqq"
    let name = "yqq.qy"

    // 1、调用BaseRegistrarImplementation的 transferFrom 函数，转移qns域名
    await baseRegistrar.connect(registrantAccount).transferFrom(registrantAddress, otherAddress, sha3(label) )
    console.log("token owner:" + await baseRegistrar.ownerOf(sha3(label)) )

    await mysleep(3000)

    // 2、调用BaseRegistrarImplementation的reclaim函数，重新声明owner
    await baseRegistrar.connect(otherAccount).reclaim(sha3(label), otherAddress );
    await mysleep(3000)
	console.log("qns name owner:" + await qns.owner(namehash.hash(name)) )
    console.log("token owner:" + await baseRegistrar.ownerOf(sha3(label)) )
    let node = namehash.hash(name)

    // 3、调用PublicResolver的setAddr函数, 重新设置（可理解为“绑定”）新的地址
    let tx = await resolver.connect(otherAccount).functions['setAddr(bytes32,address)'](node, otherAddress)
    await tx.wait()

    // 4、调用PublicResolver的addr函数， 获取转移后qns域名最新的解析结果
    await mysleep(6000)
    console.log(await (resolver.functions['addr(bytes32)'](node)))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});