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


flatten:
	npx hardhat flatten ./contracts/qyregistrar/BaseRegistrarImplementation.sol  > ./tmp/BaseRegistrarImplementation.sol
	npx hardhat flatten ./contracts/registry/QNSRegistry.sol  > ./tmp/QNSRegistry.sol
	npx hardhat flatten ./contracts/resolvers/PublicResolver.sol  > ./tmp/PublicResolver.sol
	npx hardhat flatten ./contracts/registry/ReverseRegistrar.sol  > ./tmp/ReverseRegistrar.sol
	npx hardhat flatten ./contracts/qyregistrar/QYRegistrarController.sol  > ./tmp/QYRegistrarController.sol
