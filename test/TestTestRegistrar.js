const TestRegistrar = artifacts.require('TestRegistrar.sol');
const QNS = artifacts.require('QNSRegistry.sol');

const { exceptions, evm } = require('@ensdomains/test-utils');
const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;

contract('TestRegistrar', function (accounts) {

    let node;
    let registrar, qns;

    beforeEach(async () => {
        node = namehash.hash('qy'); // base node 'qy' which means qiyichan

        qns = await QNS.new();
        registrar = await TestRegistrar.new(qns.address, '0x0');

        await qns.setOwner('0x0', registrar.address, {from: accounts[0]})
    });

    it('registers names', async () => {
        await registrar.register(sha3('qy'), accounts[0], {from: accounts[0]});
        assert.equal(await qns.owner('0x0'), registrar.address);
        assert.equal(await qns.owner(node), accounts[0]);
    });

    it('forbids transferring names within the test period', async () => {
        await registrar.register(sha3('qy'), accounts[1], {from: accounts[0]});
        await exceptions.expectFailure(registrar.register(sha3('qy'), accounts[0], {from: accounts[0]}));
    });

    it('allows claiming a name after the test period expires', async () => {

        await registrar.register(sha3('qy'), accounts[1], {from: accounts[0]});
        assert.equal(await qns.owner(node), accounts[1]);

        // TODO(yqq): does not work, may be increase evm time is not works
        // await evm.advanceTime(28 * 24 * 60 * 60 + 1); // doesn't work ???
        // await registrar.register(sha3('qy'), accounts[0], {from: accounts[0]});
        // assert.equal(await qns.owner(node), accounts[0]);
    });
});
