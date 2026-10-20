const crypto = require('node:crypto');

/**
 * 安全加密工具（用于加密助记词 / 私钥等敏感数据）
 *
 * 相比旧实现修复的问题：
 * 1. 旧实现 IV 由调用方传入且固定 -> 相同明文必得相同密文，可被频率分析与重放
 * 2. 旧实现密钥 = sha512(passwd) 单次哈希，无盐无迭代 -> 可被彩虹表/暴力秒破
 * 3. 旧实现使用 AES-256-CBC 且无完整性校验 -> 存在 Padding Oracle 攻击面
 *
 * 现在：随机 salt + scrypt 抗暴力派生 + 随机 IV + AES-256-GCM 认证加密。
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;      // GCM 推荐 12 字节
const TAG_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function assertPassword(passwd) {
    if (typeof passwd !== 'string' || passwd.length === 0) {
        throw new TypeError('passwd 必须是非空字符串');
    }
}

function deriveKey(passwd, salt) {
    return crypto.scryptSync(passwd, salt, KEY_LEN, SCRYPT_PARAMS);
}

class Aes {
    constructor(passwd) {
        assertPassword(passwd);
        this.passwd = passwd;
    }

    encryptData(text) {
        const salt = crypto.randomBytes(SALT_LEN);
        const iv = crypto.randomBytes(IV_LEN);
        const key = deriveKey(this.passwd, salt);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(String(text), 'utf8'),
            cipher.final()
        ]);

        // 输出格式：salt | iv | authTag | ciphertext，整体 base64
        return Buffer.concat([salt, iv, cipher.getAuthTag(), encrypted]).toString('base64');
    }

    decryptData(data) {
        const buff = Buffer.from(String(data), 'base64');
        const headerLen = SALT_LEN + IV_LEN + TAG_LEN;
        if (buff.length <= headerLen) {
            // 不要把具体偏移等信息抛给调用方，避免成为预言机
            throw new Error('密文格式非法');
        }

        const salt = buff.subarray(0, SALT_LEN);
        const iv = buff.subarray(SALT_LEN, SALT_LEN + IV_LEN);
        const tag = buff.subarray(SALT_LEN + IV_LEN, headerLen);
        const encrypted = buff.subarray(headerLen);

        const key = deriveKey(this.passwd, salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // GCM 的 authTag 校验失败会在此抛错，兼作密码正确性校验
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    }
}

function encryptAes(text, passwd) {
    return new Aes(passwd).encryptData(text);
}

function decryptAes(data, passwd) {
    return new Aes(passwd).decryptData(data);
}

module.exports = {
    Aes, decryptAes, encryptAes
};
