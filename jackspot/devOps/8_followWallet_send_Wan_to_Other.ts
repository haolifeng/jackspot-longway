import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";

let otherIndex = 58;
let elseAddr = walletMgr.getLeaderWallet().getAddress();

let provider = new ethers.providers.JsonRpcProvider(config.nodeUrl);
(
    async ()=>{
        await walletMgr.othersToElseAddress(provider,otherIndex, elseAddr);
    }
)()
