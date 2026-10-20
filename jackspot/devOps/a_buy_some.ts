import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";
import jackSport from "../JackSport";
import HWallet from "../../Libs/hWallet";

let size = 45;
let from = 85;
let end = from + size;

const main = async ()=>{

    for(let i= from; i< end; i++){
        let wallet:HWallet = walletMgr.getWalletByIndex(i);
        let ethWallet:ethers.Wallet = wallet.getWallet();
        console.log('index: ', i);
        await jackSport.buyIndex(ethWallet,i,config.codeStart);

    }
}
main();