"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCreationWrapper = void 0;
const MessageCreationJSON = __importStar(require("../../../build/contracts/MessageCreation.json"));
const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};
class MessageCreationWrapper {
    constructor(web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(MessageCreationJSON.abi);
    }
    get isDeployed() {
        return Boolean(this.address);
    }
    async getStoredMessage(fromAddress) {
        const data = await this.contract.methods.retrieveMessage().call({ from: fromAddress });
        return data;
    }
    async setStoredMessage(message, fromAddress) {
        const tx = await this.contract.methods.placeMessage(message).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            to: message
        });
        return tx;
    }
    async deploy(fromAddress) {
        const deployTx = await this.contract
            .deploy({
            data: MessageCreationJSON.bytecode,
            arguments: []
        })
            .send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            to: '0x0000000000000000000000000000000000000000'
        });
        this.useDeployed(deployTx.contractAddress);
        return deployTx.transactionHash;
    }
    useDeployed(contractAddress) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
exports.MessageCreationWrapper = MessageCreationWrapper;
//# sourceMappingURL=MessageCreationWrapper.js.map