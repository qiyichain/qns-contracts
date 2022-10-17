# QNS域名规则

- 1、根域名：`.qy`
- 2、单标签长度：  大于等于1，小于等于63。（前端限制，合约层只限制最小长度）
- 3、子域名： 如 `xx.yy.qy` 是 `yy.qy`子域名。合约层支持，应用层前期为了降低复杂度，可以考虑不支持
- 3、域名总长度：小于等255。（不开放子域名，总长度不会超过 67）
- 4、字符集：仅支持数字、字母（小写）、和'-'

```
示例：
1.qy （合法)
x.qy （合法）
-.qy（合法）
666.qy  （合法）
1-1.qy （合法）
hello2022.qy （合法）
111111111122222222223333333333444444444455555555556666666666123.qy  (合法）

1111111111222222222233333333334444444444555555555566666666661234.qy  (非法）
你好.qy  (非法）
たこ.qy  (非法）
한국어.qy (非法）
العربية.qy （非法）
😂.qy （非法）
```

## 域名总数
- 1个字符长度（x.qy）域名个数：37 = 26+10+1
- 2个字符长度（xx.qy）域名个数：1369 = 37^2
- 3个字符长度（xxx.qy）域名个数：50653 = 37^3
- 4个字符长度（xxxx.qy）域名个数：1874161 = 37^4

1~4字符长度的域名总数：1926220

## QNS 部署（测试链）

运行 `script/testchain-deploy.js` 执行部署

`npx hardhat run scripts/testchain-deploy.js --network testchain`

```
QNSRegistry: 0xf48E2c84971C3B7C0ca844117A9499161e601A06
BaseRegistrarImplementation: 0x32299736326D3aC86da1de620fd15f2Dc390bbAD
PublicResolver: 0x70DD1D4c6a39076398DF59442f9403bf92aC99D0
ReverseRegistrar: 0xD5A8142F09ba251837cAD35ccEF38BD363986636
QYRegistrarController: 0x6aaf1274fEa4B4e849B21681e4871312eD8C8E0D
```


# 注册流程测试

1.注册`yqq.qy`（调用`QYRegistrarController.register`注册默认会）

https://explorer-test.rarefy.vip/tx/0x1a579a48e3dfbbb7c767f0cc6908e09da3ac1b0baecbcdfeafdd8e98b9c81795


调用`QYRegistrarController`的 `register`，需要转`1 QYC`，作为购买域名的消耗。`register`函数会自动设置PublicResolver为解析器，默认将域名解析到owner地址

最短注册时间`28`天

参考js示例: [registername.js](../scripts/registername.js)

## 解析域名

调用`PublicResolver`的 `addr(bytes32)`函数，其中参数是`namehash.hash(yqq.qy`


参考js示例: [resolvename.js](../scripts/resolvename.js)


## 重新解析新的地址

调用`PublicResolver` 的`setAddr(node, addr)`, 其中node是`namehash.hash('yqq.qy')`, addr是新地址


## 域名转移和重新解析

交互合约： BaseRegistrarImplementation.sol

类似ERC721的转移操作：

- 1、调用BaseRegistrarImplementation的 transferFrom 函数，转移qns域名

https://explorer-test.rarefy.vip/tx/0xf76da28576f787d5d58f9b96e183c473cfefc16a2124b9f58f2db64b4892d165


- 2、调用BaseRegistrarImplementation的reclaim函数，重新声明owner

https://explorer-test.rarefy.vip/tx/0xc2b31319dc7b3e3dfe5c6d34f0147051c04ad04d7a66fb59055b203f179b650b

最后需要设置解析地址，交互合约：PublicResolver.sol

- 3、调用PublicResolver的setAddr函数, 重新设置（可理解为“绑定”）新的地址

https://explorer-test.rarefy.vip/tx/0x6b064742baec08e9c47aeafbc357358c8dc03a3310e8dac6580290db7d402192

其中node是  namehash.hash('yqq.qy')
addr是新地址

- 4、调用PublicResolver的addr函数， 获取转移后qns域名最新的解析结果


完整的[js代码实现](../scripts/transfername.js)

以下是核心逻辑代码

```js
let label = "yqq"
let name = "yqq.qy"

// 1、调用BaseRegistrarImplementation的 transferFrom 函数，转移qns域名
await baseRegistrar.connect(registrantAccount).transferFrom(registrantAddress, otherAddress, sha3(label) )
console.log("token owner:" + await baseRegistrar.ownerOf(sha3(label)) )

await mysleep(3000)

// 2、调用BaseRegistrarImplementation的reclaim函数，重新声明owner
await baseRegistrar.connect(otherAccount).reclaim(sha3(label), otherAddress );
await mysleep(3000)
console.log("qns name owner:" + await qns.owner(namehash.hash(name)) )
console.log("token owner:" + await baseRegistrar.ownerOf(sha3(label)) )
let node = namehash.hash(name)

// 3、调用PublicResolver的setAddr函数, 重新设置（可理解为“绑定”）新的地址
let tx = await resolver.connect(otherAccount).functions['setAddr(bytes32,address)'](node, otherAddress)
await tx.wait()

// 4、调用PublicResolver的addr函数， 获取转移后qns域名最新的解析结果
await mysleep(6000)
console.log(await (resolver.functions['addr(bytes32)'](node)))
```


## 反向解析


交互合约：ReverseRegistrar.sol

```
1.claim
2.claimForAddr （如果不切换owner可以跳过此步）
3.setName 或 setNameForAddr

```
通过地址反向获取name， 交互合约:PublicResolver.sol, 因为默认的resolver是PublicResolver, 也可以自定义其他resolver

```
name(node)


其中node是: `namehash.hash(myaddress.slice(2).toLowerCase() + '.addr.reverse')`
myaddress: 是 '0x'开头的地址字符串,
```


## SDK支持

- Java SDK: [需要修改web3j关于ENS部分代码](https://github.com/qiyichain/web3j)
- Javascript SDK: [需要修改web3.js关于ENS的代码](https://github.com/qiyichain/web3.js/)
- Python SDK [需要修改web3.py关于ENS的代码](https://github.com/qiyichain/web3.py/)
- 其他SDK暂时不修改

