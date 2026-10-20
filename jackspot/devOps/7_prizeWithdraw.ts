import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";
import jackSport from "../JackSport";
import HWallet from "../../Libs/hWallet";

let prizeIndex= 178;
const main = async ()=>{
    let size = walletMgr.getSize();
    for(let i= 0; i< size; i++){
        if(i === prizeIndex){
            let wallet:HWallet = walletMgr.getWalletByIndex(i);
            let ethWallet:ethers.Wallet = wallet.getWallet();
            await jackSport.prizeWithdraw(ethWallet);

        }

    }
}
main();
