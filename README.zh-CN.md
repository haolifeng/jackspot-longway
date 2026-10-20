# Longway / Jackspot 脚本

用于 **Jacksport** 合约（Wanchain 主网 `chainId 888` 及测试网 `chainId 999`）的批量钱包管理脚本集合。

脚本能做什么：

- 从一份 BIP-39 助记词批量派生子钱包（主网 200 个，测试网 60 个）
- 在批量子钱包之间分发 / 归集 WAN
- 批量 `buy` 号码、`redeem` 号码
- 查询用户信息、提取奖金

## 目录结构

```
.
├── Libs/
│   ├── hWallet.ts        # ethers.Wallet 的轻量封装，提供安全的转账辅助
│   ├── crypto-tools.js   # AES-256-GCM 加密/解密，用于加密敏感信息
│   └── t_crypto.js       # crypto-tools 的冒烟测试
└── jackspot/
    ├── loadEnv.ts        # 从项目根目录加载 .env（必须最先 import）
    ├── config/           # index.ts 是网络选择器
    │   ├── index.ts      # 按 NETWORK 环境变量选择主网 / 测试网
    │   ├── index_main.ts # 主网配置
    │   └── index_test.ts # 测试网配置
    ├── accounts/         # WalletMgr（派生批量子钱包，leader = 下标 0）
    ├── JackSport.ts      # 合约调用：buy / redeem / prizeWithdraw / userInfo
    ├── jacksportDelegate.json
    └── devOps/           # 一次性运维脚本，逐个运行
```

## 安装

```bash
npm install
```

需要 Node.js 16+ 及 TypeScript 运行器（推荐 `ts-node`）。

## 配置

```bash
cp .env.example .env
# 然后编辑 .env，填入助记词
```

`.env` 已被 `.gitignore` 忽略，**切勿**提交到仓库。助记词是脚本派生出所有钱包的唯一根密钥，一旦泄露即等于丢失这些地址上的全部资产。

## 选择网络

`NETWORK` 环境变量选择配置。**默认是 `test`（测试网）**——这是安全默认值，误跑不会消耗真金白银。

```bash
NETWORK=test  npx ts-node jackspot/devOps/1_getAllBlance.ts   # 安全
NETWORK=main  npx ts-node jackspot/devOps/1_getAllBlance.ts   # 真实资金
```

当 `NETWORK=main` 时，脚本会在执行任何操作前打印醒目的警告横幅。

## 运行脚本

`devOps/` 下的脚本都是一次性入口，逐个运行：

| 脚本 | 作用 |
|---|---|
| `1_getAllBlance.ts`                     | 打印每个派生钱包的余额 |
| `2_distributeWan.ts`                    | leader 给每个其它钱包转 500.1 WAN |
| `3_collectWan.ts`                       | 所有钱包的余额归集到 leader |
| `4_buy.ts`                              | 每个钱包都买一组号（size 被覆盖为 1） |
| `5_redeem.ts`                           | `1..size-1` 号钱包 redeem 号码 |
| `6_getUserInfo.ts`                      | 打印每个钱包的 `userInfoMap` |
| `7_prizeWithdraw.ts`                    | 提取下标 `178` 号钱包的奖金 |
| `8_followWallet_send_Wan_to_Other.ts`   | 把下标 `58` 号钱包的余额转给 leader |
| `9_leader_to_others_some.ts`            | leader 给 `85..129` 号钱包各转 500.1 WAN |
| `a_buy_some.ts`                         | 给 `85..129` 号钱包买号 |

示例：

```bash
NETWORK=test npx ts-node jackspot/devOps/2_distributeWan.ts
```

## 安全

本项目**直接控制链上资金**，请认真对待：

- **永远不要提交 `.env`。** 助记词泄露后无法挽回——网上有大量机器人 7×24 扫描 Git/Gitee 的新提交，命中后几分钟内就会把链上资产转空。
- **`package-lock.json` 必须入库。** 没有 lockfile，下一次 `npm install` 时如果 `ethers` 或任一间接依赖被供应链投毒，恶意 `postinstall` 脚本可直接读取 `.env` 中的助记词并外传。
- **默认走测试网。** 任何要动主网真实资金的操作必须显式声明 `NETWORK=main`。
- **没有防重入、没有 dry-run。** 交易一旦发出即不可逆。
- **地址与金额已校验。** 所有转账路径现在都会校验收款地址（`ethers.utils.isAddress`），并拒绝负数 / 格式非法的金额。请勿绕过这些校验。

## 加密工具（`Libs/crypto-tools.js`）

用于把助记词（或其它敏感信息）加密落盘。

- 算法：**AES-256-GCM**（带认证的加密，能检测篡改）
- 密钥派生：**scrypt**，每次加密使用**随机 salt**
- IV：每次加密使用**随机 12 字节**
- 输出格式：`salt | iv | authTag | ciphertext`，整体 base64

错误密码会直接抛错（fail-closed），不会返回乱码。

## 依赖

- `ethers` `^5.6.9`（v5 系列）
- `dotenv` `^16.4.1`
- `@types/node` `^18.6.1`

定期审计：

```bash
npm run audit
```

## 许可

ISC
