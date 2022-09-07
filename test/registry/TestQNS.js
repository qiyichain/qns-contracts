const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;

const { exceptions } = require("../test-utils")

let contracts = [
    [artifacts.require('./registry/QNSRegistry.sol'), 'Solidity']
];

contracts.forEach(function ([QNS, lang]) {
    contract('QNS ' + lang, function (accounts) {

        let qns;

        beforeEach(async () => {
            qns = await QNS.new();
        });

        it('should allow ownership transfers', async () => {
            let addr = '0x0000000000000000000000000000000000001234';

            let result = await qns.setOwner('0x0', addr, {from: accounts[0]});

            assert.equal(await qns.owner('0x0'), addr)

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.owner, addr);
        });

        it('should prohibit transfers by non-owners', async () => {
            await exceptions.expectFailure(
                qns.setOwner('0x1', '0x0000000000000000000000000000000000001234', {from: accounts[0]})
            );
        });

        it('should allow setting resolvers', async () => {
            let addr = '0x0000000000000000000000000000000000001234'

            let result = await qns.setResolver('0x0', addr, {from: accounts[0]});

            assert.equal(await qns.resolver('0x0'), addr);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.resolver, addr);
        });

        it('should prevent setting resolvers by non-owners', async () => {
            await exceptions.expectFailure(
                qns.setResolver('0x1', '0x0000000000000000000000000000000000001234', {from: accounts[0]})
            );
        });

        it('should allow setting the TTL', async () => {
            let result = await qns.setTTL('0x0', 3600, {from: accounts[0]});

            assert.equal((await qns.ttl('0x0')).toNumber(), 3600);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.ttl.toNumber(), 3600);
        });

        it('should prevent setting the TTL by non-owners', async () => {
            await exceptions.expectFailure(qns.setTTL('0x1', 3600, {from: accounts[0]}));
        });

        it('should allow the creation of subnodes', async () => {
            let result = await qns.setSubnodeOwner('0x0', sha3('eth'), accounts[1], {from: accounts[0]});

            assert.equal(await qns.owner(namehash.hash('eth')), accounts[1]);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.label, sha3('eth'));
            assert.equal(args.owner, accounts[1]);
        });

        it('should prohibit subnode creation by non-owners', async () => {
            await exceptions.expectFailure(qns.setSubnodeOwner('0x0', sha3('eth'), accounts[1], {from: accounts[1]}));
        });
    });
});
