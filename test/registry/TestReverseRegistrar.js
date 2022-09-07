const namehash = require('eth-ens-namehash')
const sha3 = require('web3-utils').sha3
const PublicResolver = artifacts.require('./resolvers/PublicResolver.sol')
const ReverseRegistrar = artifacts.require('./registry/ReverseRegistrar.sol')
const ENS = artifacts.require('./registry/QNSRegistry.sol')
// const NameWrapper = artifacts.require('DummyNameWrapper.sol')
const { ethers } = require('hardhat')
const {
  exceptions,
  reverse: { getReverseNode },
} = require('../test-utils')

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

function assertReverseClaimedEventEmitted(tx, addr, node) {
  assert.equal(tx.logs.length, 1)
  assert.equal(tx.logs[0].event, 'ReverseClaimed')
  assert.equal(tx.logs[0].args.addr, addr)
  assert.equal(tx.logs[0].args.node, node)
}

contract('ReverseRegistrar', function(accounts) {
  let node, node2, node3, dummyOwnableReverseNode

  let reverseRegistrar, resolver, ens, nameWrapper, dummyOwnable, defaultResolver

  beforeEach(async () => {
    node = getReverseNode(accounts[0])
    node2 = getReverseNode(accounts[1])
    node3 = getReverseNode(accounts[2])
    ens = await ENS.new()
    // nameWrapper = await NameWrapper.new()

    resolver = await PublicResolver.new(
      ens.address,
    )
    reverseRegistrar = await ReverseRegistrar.new(ens.address, resolver.address)

    await reverseRegistrar.setDefaultResolver(resolver.address)
    defaultResolver = new ethers.Contract(
      await reverseRegistrar.defaultResolver(),
      PublicResolver.abi,
      ethers.provider
    )
    dummyOwnable = await ReverseRegistrar.new(ens.address)
    dummyOwnableReverseNode = getReverseNode(dummyOwnable.address)

    await ens.setSubnodeOwner('0x0', sha3('reverse'), accounts[0], {
      from: accounts[0],
    })
    await ens.setSubnodeOwner(
      namehash.hash('reverse'),
      sha3('addr'),
      reverseRegistrar.address,
      { from: accounts[0] }
    )
  })

  it('should calculate node hash correctly', async () => {
    assert.equal(await reverseRegistrar.node.call(accounts[0]), node)
  })

  describe('claim', () => {
    it('allows an account to claim its address', async () => {
      await reverseRegistrar.claim(accounts[1], { from: accounts[0] })
      assert.equal(await ens.owner(node), accounts[1])
    })

    it('event ReverseClaimed is emitted', async () => {
      const tx = await reverseRegistrar.claim(accounts[1], { from: accounts[0] })
      assertReverseClaimedEventEmitted(tx, accounts[0], node)
    })
  })

  describe('claimForAddr', () => {
    it('allows an account to claim its address', async () => {
      await reverseRegistrar.claimForAddr(
        accounts[0],
        accounts[1],
        resolver.address,
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.owner(node), accounts[1])
    })

    it('event ReverseClaimed is emitted', async () => {
      const tx = await reverseRegistrar.claimForAddr(
        accounts[0],
        accounts[1],
        resolver.address,
        {
          from: accounts[0],
        }
      )
      assertReverseClaimedEventEmitted(tx, accounts[0], node)
    })

    it('forbids an account to claim another address', async () => {
      await exceptions.expectFailure(
        reverseRegistrar.claimForAddr(accounts[1], accounts[0], resolver.address, {
          from: accounts[0],
        })
      )
    })

    it('allows an authorised account to claim a different address', async () => {
      await ens.setApprovalForAll(accounts[0], true, { from: accounts[1] })
      await reverseRegistrar.claimForAddr(
        accounts[1],
        accounts[2],
        resolver.address,
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.owner(node2), accounts[2])
    })

    it('allows a controller to claim a different address', async () => {
      await reverseRegistrar.setController(accounts[0], true)
      await reverseRegistrar.claimForAddr(
        accounts[1],
        accounts[2],
        resolver.address,
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.owner(node2), accounts[2])
    })

    it('allows an owner() of a contract to claim the reverse node of that contract', async () => {
      await reverseRegistrar.setController(accounts[0], true)
      await reverseRegistrar.claimForAddr(
        dummyOwnable.address,
        accounts[0],
        resolver.address,
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.owner(dummyOwnableReverseNode), accounts[0])
    })
  })

  describe('claimWithResolver', () => {
    it('allows an account to specify resolver', async () => {
      await reverseRegistrar.claimWithResolver(accounts[1], accounts[2], {
        from: accounts[0],
      })
      assert.equal(await ens.owner(node), accounts[1])
      assert.equal(await ens.resolver(node), accounts[2])
    })

    it('event ReverseClaimed is emitted', async () => {
      const tx = await reverseRegistrar.claimWithResolver(accounts[1], accounts[2], {
        from: accounts[0],
      })
      assertReverseClaimedEventEmitted(tx, accounts[0], node)
    })
  })

  describe('setName', () => {
    it('sets name records', async () => {
      await reverseRegistrar.setName('testname', { from: accounts[0] })
      assert.equal(await ens.resolver(node), defaultResolver.address)
      assert.equal(await defaultResolver.name(node), 'testname')
    })

    it('event ReverseClaimed is emitted', async () => {
      const tx = await reverseRegistrar.setName('testname', {
        from: accounts[0],
      })
      assertReverseClaimedEventEmitted(tx, accounts[0], node)
    })
  })

  describe('setNameForAddr', () => {
    it('allows controller to set name records for other accounts', async () => {
      await reverseRegistrar.setController(accounts[0], true)
      await reverseRegistrar.setNameForAddr(
        accounts[1],
        accounts[0],
        resolver.address,
        'testname',
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.resolver(node2), resolver.address)
      assert.equal(await resolver.name(node2), 'testname')
    })

    it('event ReverseClaimed is emitted', async () => {
      const tx = await reverseRegistrar.setNameForAddr(
        accounts[0],
        accounts[0],
        resolver.address,
        'testname',
        {
          from: accounts[0],
        }
      )
      assertReverseClaimedEventEmitted(tx, accounts[0], node)
    })

    it('forbids non-controller if address is different from sender and not authorised', async () => {
      await exceptions.expectFailure(
        reverseRegistrar.setNameForAddr(
          accounts[1],
          accounts[0],
          resolver.address,
          'testname',
          {
            from: accounts[0],
          }
        )
      )
    })

    it('allows name to be set for an address if the sender is the address', async () => {
      await reverseRegistrar.setNameForAddr(
        accounts[0],
        accounts[0],
        resolver.address,
        'testname',
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.resolver(node), resolver.address)
      assert.equal(await resolver.name(node), 'testname')
    })

    it('allows name to be set for an address if the sender is authorised', async () => {
      ens.setApprovalForAll(accounts[1], true, { from: accounts[0] })
      await reverseRegistrar.setNameForAddr(
        accounts[0],
        accounts[0],
        resolver.address,
        'testname',
        {
          from: accounts[1],
        }
      )
      assert.equal(await ens.resolver(node), resolver.address)
      assert.equal(await resolver.name(node), 'testname')
    })

    it('allows an owner() of a contract to claimWithResolverForAddr on behalf of the contract', async () => {
      await reverseRegistrar.setNameForAddr(
        dummyOwnable.address,
        accounts[0],
        resolver.address,
        'dummyownable.eth',
        {
          from: accounts[0],
        }
      )
      assert.equal(await ens.owner(dummyOwnableReverseNode), accounts[0])
      assert.equal(
        await resolver.name(dummyOwnableReverseNode),
        'dummyownable.eth'
      )
    })
  })

  describe('setController', () => {
    it('forbid non-owner from setting a controller', async () => {
      await exceptions.expectFailure(
        reverseRegistrar.setController(accounts[1], true, { from: accounts[1] })
      )
    })
  })
})
