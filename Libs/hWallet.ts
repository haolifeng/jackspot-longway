import { ethers, BigNumber } from 'ethers'
import { Buffer } from 'buffer';

/** 校验外部传入的收款地址，防止因配置/输入被篡改而把资金转给攻击者 */
export function assertAddress(addr: string, label: string = 'address'): string {
    if (typeof addr !== 'string' || !ethers.utils.isAddress(addr)) {
        throw new Error(`非法的${label}: ${addr}`);
    }
    return ethers.utils.getAddress(addr);
}

class HWallet {
    private wallet: ethers.Wallet;
    constructor(w: ethers.Wallet) {
        if (!w) {
            throw new Error('HWallet 需要一个 ethers.Wallet 实例');
        }
        this.wallet = w;
    }


    getWallet() {
        return this.wallet;
    }
    getStrPrivateKey(): string {
        return this.wallet.privateKey;
    }
    getAddress(): string {
        return this.wallet.address;
    }
    getBufferPrivateKey(): Buffer {
        // 私钥是 0x 开头的 32 字节十六进制串，必须按 hex 解析，
        // 直接 Buffer.from(str) 会得到 66 字节的错误结果
        return Buffer.from(ethers.utils.arrayify(this.wallet.privateKey));
    }
    connect(provider: ethers.providers.JsonRpcProvider): ethers.Signer {
        let signer = this.wallet.connect(provider);
        return signer;
    }
    async getBalance(provider: ethers.providers.JsonRpcProvider): Promise<BigNumber> {
        let newWallet = this.wallet.connect(provider)
        let balance = await newWallet.getBalance();
        return balance;
    }

    /**
     * 把钱包余额（扣除手续费后）全部转出
     */
    async clearBalance(provider: ethers.providers.JsonRpcProvider, to: string) {
        const target = assertAddress(to, '收款地址');
        const newWallet = this.wallet.connect(provider);

        const totalBalance = await newWallet.getBalance();
        console.log('totalBalance: ', totalBalance.toString());

        const gasLimit = BigNumber.from(21000);
        const gasPrice = await provider.getGasPrice();
        const gasCost = gasPrice.mul(gasLimit);

        // 旧实现用 leftBalance=0 做判断，恒为 true，余额不足时 value 会变成负数
        const value = totalBalance.sub(gasCost);
        if (value.lte(0)) {
            console.log('余额不足以支付手续费，跳过: ', this.wallet.address);
            return undefined;
        }

        return await newWallet.sendTransaction({
            to: target,
            value: value,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
    }

    /**
     * 转出除 leftBalance 之外的全部余额（同样需要预留手续费）
     */
    async sendWanToElseAddr(provider: ethers.providers.JsonRpcProvider, to: string, leftBalanceStr: string = '0.5') {
        const target = assertAddress(to, '收款地址');
        const newWallet = this.wallet.connect(provider);

        const totalBalance = await newWallet.getBalance();
        console.log('totalBalance: ', totalBalance.toString());

        const leftBalance = ethers.utils.parseEther(leftBalanceStr);
        const gasLimit = BigNumber.from(21000);
        const gasPrice = await provider.getGasPrice();
        const reserve = leftBalance.add(gasPrice.mul(gasLimit));

        const value = totalBalance.sub(reserve);
        if (value.lte(0)) {
            console.log('余额不足以支付手续费与保留额，跳过: ', this.wallet.address);
            return undefined;
        }

        return await newWallet.sendTransaction({
            to: target,
            value: value,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
    }
}

export default HWallet;
