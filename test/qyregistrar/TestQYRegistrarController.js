const {
  evm,
  reverse: { getReverseNode },
  contracts: { deploy },
} = require('../test-utils')

const { expect } = require('chai')

const { ethers } = require('hardhat')
const provider = ethers.provider
const namehash = require('eth-ens-namehash')
const { toUnicode } = require('punycode')
const sha3 = require('web3-utils').sha3
const toWei = require('web3-utils').toWei

const DAYS = 24 * 60 * 60
const REGISTRATION_TIME = 28 * DAYS
const BUFFERED_REGISTRATION_COST = toWei('1', 'ether');//REGISTRATION_TIME + 3 * DAYS
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const EMPTY_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const COST = BUFFERED_REGISTRATION_COST

contract('QYRegistrarController', function() {
  let qns
  let resolver
  let resolver2 // resolver signed by accounts[1]
  let baseRegistrar
  let controller
  let controller2 // controller signed by accounts[1]
  let reverseRegistrar

  const secret =
    '0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
  let ownerAccount // Account that owns the registrar
  let registrantAccount // Account that owns test names
  let accounts = []

  async function registerName(
    name,
    txOptions = { value: BUFFERED_REGISTRATION_COST }
  ) {
    var tx = await controller.register(
      name,
      registrantAccount,
      REGISTRATION_TIME,
      txOptions
    )

    return tx
  }

  before(async () => {
    signers = await ethers.getSigners()
    ownerAccount = await signers[0].getAddress()
    registrantAccount = await signers[1].getAddress()
    accounts = [ownerAccount, registrantAccount, await signers[2].getAddress()]
    qns = await deploy('QNSRegistry' )
    baseRegistrar = await deploy(
      'BaseRegistrarImplementation',
      qns.address,
      namehash.hash('qy'),
      "Qiyichain Name Service",
       "QNS",
       "https://qns.qiyichain/nft/",
    )

    resolver = await deploy(
        'PublicResolver',
        qns.address,
      )

    reverseRegistrar = await deploy('ReverseRegistrar', qns.address, NULL_ADDRESS)

    await qns.setSubnodeOwner(EMPTY_BYTES, sha3('qy'), baseRegistrar.address)

    controller = await deploy(
      'QYRegistrarController',
      baseRegistrar.address,
      resolver.address
    )

    controller2 = controller.connect(signers[1])
    await baseRegistrar.addController(controller.address)
    await reverseRegistrar.setController(controller.address, true)

    resolver2 = await resolver.connect(signers[1])

    await qns.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), accounts[0], {
      from: accounts[0],
    })
    await qns.setSubnodeOwner(
      namehash.hash('reverse'),
      sha3('addr'),
      reverseRegistrar.address,
      { from: accounts[0] }
    )
  })

  beforeEach(async () => {
    result = await ethers.provider.send('evm_snapshot')
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [result])
  })

  const checkLabels = {
    testing: true,
    longname12345678: true,
    sixsix: true,
    five5: true,
    four: true,
    iii: true,
    ii: true,
    i: true,
    '': false,
    'xx-y':true,

    // { ni } { hao } { ma } (chinese; simplified)
    ?????????: false,

    // { ta } { ko } (japanese; hiragana)
    ??????: false,

    // { poop } { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9\ud83d\udca9': false,

    // { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9': false,
  }

  it('should report label validity', async () => {
    for (const label in checkLabels) {
      expect(await controller.valid(label)).to.equal(checkLabels[label], label)
    }
  })

  it('should report unused names as available', async () => {
    expect(await controller.available(sha3('available'))).to.equal(true)
  })

  it('should permit new registrations', async () => {
    const name = 'newname'
    const balanceBefore = await web3.eth.getBalance(controller.address)
    const tx = await registerName(name)
    const block = await provider.getBlock(tx.blockNumber)
    await expect(tx)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        name,
        sha3(name),
        registrantAccount,
        COST,
        block.timestamp + REGISTRATION_TIME
      )

    expect(
      ((await web3.eth.getBalance(controller.address)) - balanceBefore).toString()
    ).to.equal( COST)
  })

  it('should revert when not enough ether is transferred', async () => {
    await expect(registerName('newname', { value: 0 })).to.be.revertedWith(
      'Not enough payment'
    )
  })

  it('should report registered names as unavailable', async () => {
    const name = 'newname'
    await registerName(name)
    expect(await controller.available(name)).to.equal(false)
  })

  it('should permit new registrations with resolver and records', async () => {
    var balanceBefore = await web3.eth.getBalance(controller.address)
    var tx = await controller.register(
      'newconfigname',
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    const block = await provider.getBlock(tx.blockNumber)

    await expect(tx)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        'newconfigname',
        sha3('newconfigname'),
        registrantAccount,
        COST,
        block.timestamp + REGISTRATION_TIME
      )

    expect(
      ((await web3.eth.getBalance(controller.address)) - balanceBefore).toString()
    ).to.equal(COST)

    var nodehash = namehash.hash('newconfigname.qy')
    expect(await qns.resolver(nodehash)).to.equal(resolver.address)
    expect(await resolver['addr(bytes32)'](nodehash)).to.equal(
      registrantAccount
    )
  })


  it('should permit a registration with resolver but no records', async () => {
    const balanceBefore = await web3.eth.getBalance(controller.address)
    let tx2 = await controller.register(
      'newconfigname2',
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    const block = await provider.getBlock(tx2.blockNumber)

    await expect(tx2)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        'newconfigname2',
        sha3('newconfigname2'),
        registrantAccount,
        COST,
        block.timestamp + REGISTRATION_TIME
      )

    const nodehash = namehash.hash('newconfigname2.qy')
    expect(await qns.resolver(nodehash)).to.equal(resolver.address)
    expect(await resolver['addr(bytes32)'](nodehash)).to.equal(registrantAccount)
    expect(
        ((await web3.eth.getBalance(controller.address)) - balanceBefore).toString()
      ).to.equal(COST)
  })

  it('should reject duplicate registrations', async () => {
    expect(
      controller.register(
        'newname',
        registrantAccount,
        REGISTRATION_TIME,
        secret,
        {
          value: BUFFERED_REGISTRATION_COST,
        }
      )
    ).to.be.revertedWith('QYRegistrarController: Name is unavailable')
  })

  it('should allow anyone to renew a name', async () => {
    await registerName('newname')
    var expires = await baseRegistrar.nameExpires(sha3('newname'))
    var balanceBefore = await web3.eth.getBalance(controller.address)
    const duration = 86400
    const price = await controller.rentPrice(sha3('newname'), duration)
    // console.log("=========price is ===> ", price)

    await controller.renew('newname', duration, { value: price })
    var newExpires = await baseRegistrar.nameExpires(sha3('newname'))
    expect(newExpires.toNumber() - expires.toNumber()).to.equal(86400)
    expect(
      ((await web3.eth.getBalance(controller.address)) - balanceBefore).toString()
    ).to.equal(COST)
  })

  it('should require sufficient value for a renewal', async () => {
    expect(controller.renew('name', 86400)).to.be.revertedWith(
      'ETHController: Not enough Ether provided for renewal'
    )
  })

  it('should allow anyone to withdraw funds and transfer to the registrar owner', async () => {
    await controller.withdraw({ from: ownerAccount })
    expect(parseInt(await web3.eth.getBalance(controller.address))).to.equal(0)
  })

  it('should not set the reverse record of the account when set to false', async () => {
    await controller.register(
      'noreverse',
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    expect(await resolver.name(getReverseNode(ownerAccount))).to.equal('')
  })

  it('approval should reduce gas for registration', async () => {
    const label = 'other'
    const name = label + '.qy'
    const node = namehash.hash(name)

    const gasA = await controller2.estimateGas.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    await resolver2.setApprovalForAll(controller.address, true)

    const gasB = await controller2.estimateGas.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    const tx = await controller2.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      { value: BUFFERED_REGISTRATION_COST }
    )

    // console.log("=====$$$$$$$$$$$==>", (await tx.wait()).gasUsed.toString())
    // console.log("=====$$$$$$$$$$$==>", (await tx.wait()).status)

    expect((await tx.wait()).status).to.equal(1);

    console.log(gasA.toString(), gasB.toString())

    expect(await resolver2['addr(bytes32)'](node)).to.equal(registrantAccount)
  })
})
