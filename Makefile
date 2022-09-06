all: compile

.PHONY:compile
compile:
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
