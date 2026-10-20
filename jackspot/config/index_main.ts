
// 主网配置（chainId 888）
// 备用节点（原 gwan-ssl 接入点）：https://gwan-ssl.wandevs.org:56891
let codeStartOptions = [0, 3333, 6666];
let config = {

    nodeUrl: 'https://nodes.wandevs.org/wan',
    chainId: 888,
    Proxy: '0x76b074d91f546914c6765ef81cbdc6f9c7da5685',
    Delegate: '0x6558b7926a6c9882d5c1b83731f12fd132dfe767',
    size: 200,
    basePath: "m/44\'/60\'/0\'/0/",
    codeStartOptions: codeStartOptions,
    codeStart: codeStartOptions[0]
}
export default config
