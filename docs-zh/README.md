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
QNSRegistry: 0x64770701F57Be408A58e48b48497d2171b1565F9
BaseRegistrarImplementation: 0xd5677159d620c7d870AacC486Ae04c23A3cFd71B
PublicResolver: 0x02BDA5D2D6810B18033C1c9516A2Ef5A0f84934f
ReverseRegistrar: 0xBC7F9Cf0c3e5d134144800Ef4041A2D02E1050aE
QYRegistrarController: 0xEe63C92aC8793dA96AA44007147F3bA25D1c6F6d
```


# 注册流程测试

1.注册`yqq.qy`（调用`QYRegistrarController.registe`注册默认会）

https://explorer-test.rarefy.vip/tx/0x2153ff35d9951fbb5aa260f1cde509ddcde58132e2332e11d2b57504ce11663b

交互合约:`QYRegistrarController`，包含了`commit-reveal`

```
1.makeCommitment
2.commit
3.register，需要转1000wei，作为购买域名的消耗。register会自动设置PublicResolver为解析器，默认将域名解析到owner地址

```


## 重新解析新的地址

交互合约:PublicResolver.sol

```
setAddr(node, addr)

其中node是  namehash.hash('yqq.qy')
addr是新地址
```


## 域名转移和重新解析

交互合约： BaseRegistrarImplementation.sol

类似ERC721的转移操作：

- 1.approve(to, tokenId)

to：授权给新的地址
tokenId： 是keccak256("yqq")，而不是 namehash("yqq.qy")

> https://explorer-test.rarefy.vip/tx/0xb40e9f8a7b19806dc92b4c8aa10e7a425bf9e1b4802c6c6d5a708927d3318ae4

- 2.transferFrom

    > https://explorer-test.rarefy.vip/tx/0x46e320dfac332cef0a094c7640c8360d73019303bb3086bd078923448c9958ef


- 3.reclaim 重新声明owner的地址

    > https://explorer-test.rarefy.vip/tx/0xbb87624591b095031800840264be20f64e67a9b2c93644aeabae0870da83207f

最后需要设置解析地址，交互合约：PublicResolver.sol

- 4.setAddr(node, addr)

    > https://explorer-test.rarefy.vip/tx/0x863c99450544e4f1be70f0f5fdcd0b5ac6a8f2f06c1f93d71cd27c9597a9bbd1

其中node是  namehash.hash('yqq.qy')
addr是新地址



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
