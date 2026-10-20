import '../loadEnv';

import mainConfig from './index_main';
import testConfig from './index_test';

export type NetworkName = 'main' | 'test';
type RawConfig = typeof mainConfig;
export type AppConfig = RawConfig & { network: NetworkName };

const NETWORKS: Record<NetworkName, RawConfig> = {
    main: mainConfig,
    test: testConfig,
};

/**
 * 解析 NETWORK 环境变量。
 * 未显式指定时默认走测试网：资金类脚本应当 "安全默认"，
 * 避免误跑 devOps 脚本时直接消耗主网真金白银。
 */
function resolveNetwork(): { name: NetworkName; explicit: boolean } {
    const raw = (process.env.NETWORK || '').trim().toLowerCase();

    if (raw === '') {
        return { name: 'test', explicit: false };
    }
    if (raw === 'main' || raw === 'mainnet') {
        return { name: 'main', explicit: true };
    }
    if (raw === 'test' || raw === 'testnet') {
        return { name: 'test', explicit: true };
    }
    throw new Error(`未知的 NETWORK="${process.env.NETWORK}"，可选值: main | test`);
}

const { name: network, explicit } = resolveNetwork();

const config: AppConfig = {
    ...NETWORKS[network],
    network: network,
};

const LINE = '='.repeat(64);
console.log(LINE);
console.log(`网络: ${network.toUpperCase()}    chainId=${config.chainId}`);
console.log(`节点: ${config.nodeUrl}`);
console.log(`合约: Proxy=${config.Proxy}`);
console.log(`钱包: ${config.size} 个    派生路径: ${config.basePath}`);
if (network === 'main') {
    console.log('');
    console.log('!!! 警告：正在操作【主网】，所有交易消耗真实资金且不可撤销 !!!');
} else if (!explicit) {
    console.log('');
    console.log('提示：未设置 NETWORK，已默认使用【测试网】。');
    console.log('      需要操作主网请在 .env 中显式设置 NETWORK=main');
}
console.log(LINE);

export default config;
