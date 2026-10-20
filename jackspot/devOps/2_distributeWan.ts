import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";

let provider = new ethers.providers.JsonRpcProvider(config.nodeUrl);
(
    async ()=>{
        await walletMgr.leaderSenderOthers(provider,'500.1');
    }
)()