const {
    Aes, decryptAes, encryptAes
} = require('./crypto-tools');

const run = async () => {
    let text = "this is a secret mnemonic";
    let password = "a-strong-passphrase";

    // 每次加密都会生成随机 salt/IV，因此同一明文两次结果不同
    let secrText = encryptAes(text, password);
    console.log(secrText);

    let mingText = decryptAes(secrText, password);
    console.log(mingText);

    // 错误密码应直接抛错，而不是返回乱码
    try {
        decryptAes(secrText, 'wrong-password');
        console.log('错误密码竟然解密成功 —— 严重问题！');
    } catch (e) {
        console.log('错误密码被正确拒绝:', e.message);
    }

    const aes = new Aes(password);
    console.log(aes.decryptData(aes.encryptData(text)) === text);
}

run();
