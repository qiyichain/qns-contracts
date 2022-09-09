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