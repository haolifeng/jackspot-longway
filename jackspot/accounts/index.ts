import '../loadEnv';

import config from '../config';
import WalletMgr from "./WalletMgr";

const monicWords = process.env.WORDS;

// 缺失时立即失败，避免 ethers.Wallet.fromMnemonic(undefined) 抛出无意义的异常
if (!monicWords || monicWords.trim().length === 0) {
    throw new Error(
        '未配置环境变量 WORDS（钱包助记词）。请在项目根目录创建 .env 并设置 WORDS="..."（可参考 .env.example）。'
    );
}

const walletMgr = new WalletMgr(monicWords, config.size, config.basePath);

export default walletMgr;
