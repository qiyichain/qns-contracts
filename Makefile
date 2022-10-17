all: compile

.PHONY:compile
compile: clean
	yarn compile

.PHONY:test
test:clean
	yarn test

.PHONY:clean
clean:
	yarn clean
	rm -rf cache


.PHONY:remix
remix:
	remixd -s ./ -u https://remix.ethereum.org



deploy-testchain: compile
	npx hardhat run scripts/testchain-deploy.js --network testchain


registername:
	npx hardhat run scripts/registername.js --network testchain

transfername:
	npx hardhat run scripts/transfername.js --network testchain

resolvename:
	npx hardhat run scripts/resolve.js --network testchain

flatten:
	npx hardhat flatten ./contracts/qyregistrar/BaseRegistrarImplementation.sol  > ./flattened/BaseRegistrarImplementation.sol
	npx hardhat flatten ./contracts/registry/QNSRegistry.sol  > ./flattened/QNSRegistry.sol
	npx hardhat flatten ./contracts/resolvers/PublicResolver.sol  > ./flattened/PublicResolver.sol
	npx hardhat flatten ./contracts/registry/ReverseRegistrar.sol  > ./flattened/ReverseRegistrar.sol
	npx hardhat flatten ./contracts/qyregistrar/QYRegistrarController.sol  > ./flattened/QYRegistrarController.sol
