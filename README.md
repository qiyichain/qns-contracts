# QNS

**QNS(Qiyichain Name Service) is fork of QNS.**

For documentation of the QNS system, see https://qns.qiyichain.com.

## npm package

This repo doubles as an npm package with the compiled JSON contracts

```js
import {
  BaseRegistrar,
  BaseRegistrarImplementation,
  BatchRenew,
  QNS,
  QNSRegistry,
  QYRegistrarController,
  PublicResolver,
  Resolver,
  ReverseRegistrar,
  TestRegistrar
} from '@qiyichain/qns-contracts'
```

## Importing from solidity

```solidity
// Registry
import '@qiyichain/qns-contracts/contracts/registry/QNS.sol';
import '@qiyichain/qns-contracts/contracts/registry/QNSRegistry.sol';
import '@qiyichain/qns-contracts/contracts/registry/QNSRegistryWithFallback.sol';
import '@qiyichain/qns-contracts/contracts/registry/ReverseRegistrar.sol';
import '@qiyichain/qns-contracts/contracts/registry/TestRegistrar.sol';
// EthRegistrar
import '@qiyichain/qns-contracts/contracts/ethregistrar/BaseRegistrar.sol';
import '@qiyichain/qns-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol';
import '@qiyichain/qns-contracts/contracts/ethregistrar/BatchNew.sol';
import '@qiyichain/qns-contracts/contracts/ethregistrar/BaseRegistrar.sol';
import '@qiyichain/qns-contracts/contracts/ethregistrar/QYRegistrarController.sol';
// Resolvers
import '@qiyichain/qns-contracts/contracts/resolvers/PublicResolver.sol';
import '@qiyichain/qns-contracts/contracts/resolvers/Resolver.sol';
```

##  Accessing to binary file.

If your environment does not have compiler, you can access to the raw hardhat artifacts files at `node_modules/@qiyichain/qns-contracts/artifacts/contracts/${modName}/${contractName}.sol/${contractName}.json`


## Contracts

## Registry

The QNS registry is the core contract that lies at the heart of QNS resolution. All QNS lookups start by querying the registry. The registry maintains a list of domains, recording the owner, resolver, and TTL for each, and allows the owner of a domain to make changes to that data. It also includes some generic registrars.

### QNS.sol

Interface of the QNS Registry.

### QNSRegistry

Implementation of the QNS Registry, the central contract used to look up resolvers and owners for domains.


### ReverseRegistrar

Implementation of the reverse registrar responsible for managing reverse resolution via the .addr.reverse special-purpose TLD.


### TestRegistrar

Implementation of the `.test` registrar facilitates easy testing of QNS on the Ethereum test networks. Currently deployed on Ropsten network, it provides functionality to instantly claim a domain for test purposes, which expires 28 days after it was claimed.


## QYRegistrar

Implements an QNS registrar intended for the `.qy` TLD.

These contracts were audited by ConsenSys dilligence

### BaseRegistrar

BaseRegistrar is the contract that owns the TLD in the QNS registry. This contract implements a minimal set of functionality:

 - The owner of the registrar may add and remove controllers.
 - Controllers may register new domains and extend the expiry of (renew) existing domains. They can not change the ownership or reduce the expiration time of existing domains.
 - Name owners may transfer ownership to another address.
 - Name owners may reclaim ownership in the QNS registry if they have lost it.
 - Owners of names in the interim registrar may transfer them to the new registrar, during the 1 year transition period. When they do so, their deposit is returned to them in its entirety.

This separation of concerns provides name owners strong guarantees over continued ownership of their existing names, while still permitting innovation and change in the way names are registered and renewed via the controller mechanism.

### QYRegistrarController

QYRegistrarController is the first implementation of a registration controller for the new registrar. This contract implements the following functionality:

 - The owner of the registrar may set a price oracle contract, which determines the cost of registrations and renewals based on the name and the desired registration or renewal duration.
 - The owner of the registrar may withdraw any collected funds to their account.
 - Users can register new names using a commit/reveal process and by paying the appropriate registration fee.
 - Users can renew a name by paying the appropriate fee. Any user may renew a domain, not just the name's owner.

The commit/reveal process is used to avoid frontrunning, and operates as follows:

 1. A user commits to a hash, the preimage of which contains the name to be registered and a secret value.
 2. After a minimum delay period and before the commitment expires, the user calls the register function with the name to register and the secret value from the commitment. If a valid commitment is found and the other preconditions are met, the name is registered.

The minimum delay and expiry for commitments exist to prevent miners or other users from effectively frontrunnig registrations.

## Resolvers

Resolver implements a general-purpose QNS resolver that is suitable for most standard QNS use-cases. The public resolver permits updates to QNS records by the owner of the corresponding name.

PublicResolver includes the following profiles that implements different EIPs.

- ABIResolver = EIP 205 - ABI support (`ABI()`).
- AddrResolver = EIP 137 - Contract address interface. EIP 2304 - Multicoin support (`addr()`).
- ContentHashResolver = EIP 1577 - Content hash support (`contenthash()`).
- InterfaceResolver = EIP 165 - Interface Detection (`supportsInterface()`).
- NameResolver = EIP 181 - Reverse resolution (`name()`).
- PubkeyResolver = EIP 619 - SECP256k1 public keys (`pubkey()`).
- TextResolver = EIP 634 - Text records (`text()`).

## Developer guide

### How to setup

```
git clone https://github.com/qiyichain/qns-contracts
cd qns-contracts
yarn
```

### How to run tests

```
yarn test


# single file test
npx hardhat test ./test/ethregistrar/TestBatchRenew.js   --network hardhat
```

### How to publish

```
yarn pub
```

### Release flow

Smart contract development tends to take a long release cycle. To prevent unnecesarily dependency conflicts, please create a feature branch (`features/$BRNACH_NAME`) and raise a PR against the feature branch. The feature branch must be merged into master only after the smart contracts are deployed to the Ethereum mainnet.
