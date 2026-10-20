import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";
import jackSport from "../JackSport";
import HWallet from "../../Libs/hWallet";

const main = async ()=>{
    let size = walletMgr.getSize();
    
    for(let i= 1; i< size; i++){

        let wallet:HWallet = walletMgr.getWalletByIndex(i);
        let ethWallet:ethers.Wallet = wallet.getWallet();
        console.log('index: ',i);
        await jackSport.redeemIndex(ethWallet,i,config.codeStart);

    }
}
main();