import { ethers } from 'ethers';
import config from '../config';
import walletMgr from "../accounts";

let from = 85;
let to = 129;

let provider = new ethers.providers.JsonRpcProvider(config.nodeUrl);
(
    async ()=>{
        await walletMgr.leaderSendOthers_some(provider,'500.1', from, to);
    }
)()