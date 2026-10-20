import { BigNumber, ethers } from 'ethers';
import config from "./config";
import abi from './jacksportDelegate.json';

/** 每个号码的购买金额（WAN） */
const BUY_AMOUNT_PER_CODE = '10';

function assertCodes(codes: number[]): number[] {
    if (!Array.isArray(codes) || codes.length === 0) {
        throw new Error('codes 不能为空');
    }
    for (const code of codes) {
        if (!Number.isInteger(code) || code < 0 || !Number.isSafeInteger(code)) {
            throw new Error(`非法的号码: ${code}`);
        }
    }
    return codes;
}

class JackSport {
    private provider: ethers.providers.JsonRpcBatchProvider;
    private scInst: ethers.Contract;
    constructor() {
        // 校验合约地址，防止配置被篡改后把资金打进攻击者合约
        const proxy = ethers.utils.getAddress(String(config.Proxy));

        this.provider = new ethers.providers.JsonRpcBatchProvider(config.nodeUrl);
        this.scInst = new ethers.Contract(proxy, abi, this.provider);
    }

    async buy(wallet: ethers.Wallet, codes: number[]) {
        assertCodes(codes);

        let amounts: BigNumber[] = [];
        // 用 BigNumber 累加，避免 10 * codes.length 这类数字运算的精度问题
        let totalValue = BigNumber.from(0);
        for (let i = 0; i < codes.length; i++) {
            let amount = ethers.utils.parseEther(BUY_AMOUNT_PER_CODE);
            amounts.push(amount);
            totalValue = totalValue.add(amount);
        }

        let signer = wallet.connect(this.provider);
        let signedSc = this.scInst.connect(signer);

        let tx = await signedSc.buy(codes, amounts, {
            gasLimit: 10000000,
            value: totalValue
        });

        let ret = await tx.wait();
        console.log('ret: ', ret);
        return ret;
    }
    async buyIndex(wallet: ethers.Wallet, index: number, start: number = 0) {
        let startCode = start + index * 50;
        let codes: number[] = [];
        for (let i = 0; i < 50; i++) {
            codes.push(startCode + i);
        }
        return await this.buy(wallet, codes);
    }

    async redeem(wallet: ethers.Wallet, codes: number[]) {
        assertCodes(codes);

        let signer = wallet.connect(this.provider);
        let signedSc = this.scInst.connect(signer);

        let tx = await signedSc.redeem(codes, {
            gasLimit: 10000000,
        });

        let ret = await tx.wait();
        console.log('ret: ', ret);
        return ret;
    }
    async redeemIndex(wallet: ethers.Wallet, index: number, start: number = 0) {
        let startCode = start + index * 50;
        let codes: number[] = [];
        for (let i = 0; i < 50; i++) {
            codes.push(startCode + i);
        }
        console.log('redeem --index: ', index);
        return await this.redeem(wallet, codes);
    }
    async userInfoMap(wallet: ethers.Wallet) {
        let address = wallet.address;
        let userInfo = await this.scInst.userInfoMap(address);
        console.log('userInfo.prize: ', userInfo.prize.toString());
        console.log('userInfo.codeCount: ', userInfo.codeCount.toNumber());
        return userInfo;
    }
    async prizeWithdraw(wallet: ethers.Wallet) {
        let signer = wallet.connect(this.provider);
        let signedSc = this.scInst.connect(signer);

        let tx = await signedSc.prizeWithdraw({
            gasLimit: 10000000,
        });

        let ret = await tx.wait();
        console.log('ret: ', ret);
        return ret;
    }

}
let jackSport = new JackSport();
export default jackSport;
