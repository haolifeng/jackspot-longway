import HWallet, { assertAddress } from "../../Libs/hWallet";
import { ethers } from 'ethers';

/** 校验金额字符串，避免 parseEther 抛出难懂的错误或传入负数 */
function assertAmount(value: string): string {
    if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value) || Number(value) <= 0) {
        throw new Error(`非法的转账金额: ${value}`);
    }
    return value;
}

class WalletMgr {
    private size: number;
    private basePath: string;
    private walletArray: HWallet[];
    private leader: HWallet;

    constructor(words: string, size: number, basePath: string) {
        if (typeof words !== 'string' || words.trim().length === 0) {
            throw new Error('助记词不能为空');
        }
        if (!Number.isInteger(size) || size <= 0) {
            throw new Error(`钱包数量 size 必须为正整数，当前为: ${size}`);
        }

        // 助记词只用于派生，不作为实例字段常驻内存
        this.size = size;
        this.basePath = basePath;
        this.walletArray = [];

        for (let i = 0; i < this.size; i++) {
            let w = ethers.Wallet.fromMnemonic(words, this.basePath + i);
            this.walletArray.push(new HWallet(w));
        }
        this.leader = this.walletArray[0];
    }

    getLeaderWallet() {
        return this.leader;
    }
    getSize(): number { return this.walletArray.length; }
    getWalletByIndex(index: number): HWallet {
        const wallet = this.walletArray[index];
        if (!wallet) {
            throw new Error(`钱包下标越界: ${index}，当前共 ${this.walletArray.length} 个钱包`);
        }
        return wallet;
    }
    getAllWallet(): HWallet[] { return [...this.walletArray]; }

    async getAllBalance(provider: ethers.providers.JsonRpcProvider) {
        for (let i = 0; i < this.walletArray.length; i++) {
            let bnBalance = await this.walletArray[i].getBalance(provider);
            console.log(i + ': ', ethers.utils.formatEther(bnBalance));
        }
    }
    async getBalancebyIndex(provider: ethers.providers.JsonRpcProvider, index: number) {
        let bnBalance = await this.getWalletByIndex(index).getBalance(provider);
        console.log(index + ': ', ethers.utils.formatEther(bnBalance));
    }
    async leaderSenderOthers(provider: ethers.providers.JsonRpcProvider, value: string) {
        const amount = assertAmount(value);
        let newLeader = this.leader.connect(provider);
        for (let i = 1; i < this.walletArray.length; i++) {
            let otherAddress = this.getWalletByIndex(i).getAddress();

            let tx = await newLeader.sendTransaction({
                to: otherAddress,
                value: ethers.utils.parseEther(amount)
            })
            let ret = await tx.wait();
            console.log(i + '- tx: ', ret);
        }
    }
    async othersToLender(provider: ethers.providers.JsonRpcProvider) {
        let to = this.leader.getAddress();
        for (let i = 1; i < this.walletArray.length; i++) {
            let otherWallet = this.walletArray[i];
            let tx = await otherWallet.clearBalance(provider, to);
            if (!tx) {
                continue;
            }
            let ret = await tx.wait();
            console.log(i + ' - ret.status : ', ret.status);
        }
    }

    async othersToElseAddress(provider: ethers.providers.JsonRpcProvider, otherIndex: number, elseAddr: string) {
        const to = assertAddress(elseAddr, '收款地址');
        const otherWallet = this.getWalletByIndex(otherIndex);

        let tx = await otherWallet.sendWanToElseAddr(provider, to);
        if (!tx) {
            return;
        }
        let ret = await tx.wait();
        console.log(otherIndex + ' - ret.status : ', ret.status);
    }

    async leaderSendOthers_some(provider: ethers.providers.JsonRpcProvider, value: string, from: number, to: number) {
        const amount = assertAmount(value);
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to >= this.walletArray.length || from > to) {
            throw new Error(`非法的下标区间: [${from}, ${to}]，可用范围 0 ~ ${this.walletArray.length - 1}`);
        }

        let newLeader = this.leader.connect(provider);
        for (let i = from; i <= to; i++) {
            let otherAddress = this.getWalletByIndex(i).getAddress();

            let tx = await newLeader.sendTransaction({
                to: otherAddress,
                value: ethers.utils.parseEther(amount)
            })
            let ret = await tx.wait();
            console.log(i + '- tx: ', ret);
        }
    }
}

export default WalletMgr;
