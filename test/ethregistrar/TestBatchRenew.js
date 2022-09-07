const QNS = artifacts.require('./registry/QNSRegistry')
const PublicResolver = artifacts.require('./resolvers/PublicResolver')
const BaseRegistrar = artifacts.require('./BaseRegistrarImplementation')
const QYRegistrarController = artifacts.require('./QYRegistrarController')
const BatchRenew = artifacts.require('./BatchRenew')

const namehash = require('eth-ens-namehash')
const sha3 = require('web3-utils').sha3
const toBN = require('web3-utils').toBN
const { exceptions } = require('../test-utils')

const QY_LABEL = sha3('qy')
const QY_NAMEHASH = namehash.hash('qy')

contract('BatchRenew', function(accounts) {
  let qns;
  let resolver
  let baseRegistrar
  let controller

  const ownerAccount = accounts[0] // Account that owns the registrar
  const registrantAccount = accounts[1] // Account that owns test names
  const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

  before(async () => {
    // Create a registry
    qns = await QNS.new()
    // nameWrapper = await NameWrapper.new()
    // Create a public resolver
    resolver = await PublicResolver.new(
      qns.address
    )

    // Create a base registrar
    baseRegistrar = await BaseRegistrar.new(qns.address, QY_NAMEHASH,
        "Qiyichain Name Service", "QNS", "https://qns.qiyichain/nft/", {
      from: ownerAccount,
    })
    console.log('========> baseRegistrar.addres', baseRegistrar.address)

    controller = await QYRegistrarController.new(
      baseRegistrar.address,
      resolver.address,
      600,
      86400,
      { from: ownerAccount }
    )
    console.log('========> controller.addres', controller.address)
    await baseRegistrar.addController(controller.address, {
      from: ownerAccount,
    })
    await baseRegistrar.addController(ownerAccount, { from: ownerAccount })
    // Create the bulk registration contract
    batchRenew = await BatchRenew.new(qns.address)

    // Configure a resolver for .eth and register the controller interface
    // then transfer the .eth node to the base registrar.
    await qns.setSubnodeRecord(
      '0x0',
      QY_LABEL,
      ownerAccount,
      resolver.address,
      0
    )
    // 0x018fac06 is COMMITMENT_CONTROLLER_ID
    await resolver.setInterface(QY_NAMEHASH, '0x018fac06', controller.address)
    await qns.setOwner(QY_NAMEHASH, baseRegistrar.address)

    // Register some names
    for (const name of ['test1', 'test2', 'test3']) {
      await baseRegistrar.register(sha3(name), registrantAccount, 31536000)
    }
  })

  it('should return default rentPrice 1000', async () => {
    assert.equal(await controller._rentPrice(), 1000)
  })

  it('should return default rentPrice 1000', async () => {
    let x = await batchRenew.rentPrice(["xxx"], 0)
  })



  it('should return the cost of a bulk renewal', async () => {
    assert.equal(
      await batchRenew.rentPrice(['test1', 'test2'], 86400),
      2000
    )
  })

  it('should raise an error trying to renew a nonexistent name', async () => {
    await exceptions.expectFailure(batchRenew.renewAll(['foobar'], 86400))
  })

  it('should permit bulk renewal of names', async () => {
    const oldExpiry = await baseRegistrar.nameExpires(sha3('test2'))
    const tx = await batchRenew.renewAll(['test1', 'test2'], 86400, {
      value: 86401 * 2,
    })
    assert.equal(tx.receipt.status, true)
    const newExpiry = await baseRegistrar.nameExpires(sha3('test2'))
    assert.equal(newExpiry - oldExpiry, 86400)
    // Check any excess funds are returned
    assert.equal(await web3.eth.getBalance(batchRenew.address), 0)
  })
})
