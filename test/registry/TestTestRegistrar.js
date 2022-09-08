const TestRegistrar = artifacts.require('./registry/TestRegistrar.sol');
const QNS = artifacts.require('./registry/QNSRegistry.sol');

const { exceptions, evm } = require("../test-utils");
const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;

contract('TestRegistrar', function (accounts) {

    let node;
    let registrar, qns;

    beforeEach(async () => {
        node = namehash.hash('eth');

        qns = await QNS.new();
        registrar = await TestRegistrar.new(qns.address, '0x0');

        await qns.setOwner('0x0', registrar.address, {from: accounts[0]})
    });

    it('registers names', async () => {
        await registrar.register(sha3('eth'), accounts[0], {from: accounts[0]});
        assert.equal(await qns.owner('0x0'), registrar.address);
        assert.equal(await qns.owner(node), accounts[0]);
    });

    it('forbids transferring names within the test period', async () => {
        await registrar.register(sha3('eth'), accounts[1], {from: accounts[0]});
        await exceptions.expectFailure(registrar.register(sha3('eth'), accounts[0], {from: accounts[0]}));
    });

    it('allows claiming a name after the test period expires', async () => {
        await registrar.register(sha3('eth'), accounts[1], {from: accounts[0]});
        assert.equal(await qns.owner(node), accounts[1]);

        await evm.advanceTime(28 * 24 * 60 * 60 + 1);

        await registrar.register(sha3('eth'), accounts[0], {from: accounts[0]});
        assert.equal(await qns.owner(node), accounts[0]);
    });
});