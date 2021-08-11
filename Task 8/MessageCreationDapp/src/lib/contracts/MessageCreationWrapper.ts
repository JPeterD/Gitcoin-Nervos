import Web3 from 'web3';
import * as MessageCreationJSON from '../../../build/contracts/MessageCreation.json';
import { MessageCreation } from '../../types/MessageCreation';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class MessageCreationWrapper {
    web3: Web3;

    contract: MessageCreation;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(MessageCreationJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getStoredMessage(fromAddress: string) {
        const data = await this.contract.methods.retrieveMessage().call({ from: fromAddress });

        return data;
    }

    async setStoredMessage(message: string, fromAddress: string) {
        const tx = await this.contract.methods.placeMessage(message).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            to: message
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: MessageCreationJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
