import Web3 from 'web3';
import { MessageCreation } from '../../types/MessageCreation';
export declare class MessageCreationWrapper {
    web3: Web3;
    contract: MessageCreation;
    address: string;
    constructor(web3: Web3);
    get isDeployed(): boolean;
    getStoredMessage(fromAddress: string): Promise<string>;
    setStoredMessage(message: string, fromAddress: string): Promise<import("web3-core").TransactionReceipt>;
    deploy(fromAddress: string): Promise<any>;
    useDeployed(contractAddress: string): void;
}
