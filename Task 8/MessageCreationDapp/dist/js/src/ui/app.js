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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
const react_1 = __importStar(require("react"));
const web3_1 = __importDefault(require("web3"));
const react_toastify_1 = require("react-toastify");
require("./app.scss");
require("react-toastify/dist/ReactToastify.css");
const web3_2 = require("@polyjuice-provider/web3");
const nervos_godwoken_integration_1 = require("nervos-godwoken-integration");
const CompiledContractArtifact = __importStar(require("../../build/contracts/ERC20.json"));
const MessageCreationWrapper_1 = require("../lib/contracts/MessageCreationWrapper");
const config_1 = require("../config");
const force_bridge = 'https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos';
const SUDT_Proxy = '0xD3Dc1fBfF0949290d7227856481cC7fEF2caFd54';
async function createWeb3() {
    // Modern dapp browsers...
    if (window.ethereum) {
        const godwokenRpcUrl = config_1.CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: config_1.CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: config_1.CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };
        const provider = new web3_2.PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new web3_1.default(provider || web3_1.default.givenProvider);
        try {
            // Request account access if needed
            await window.ethereum.enable();
        }
        catch (error) {
            // User denied account access...
        }
        return web3;
    }
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}
function App() {
    const [web3, setWeb3] = react_1.useState(null);
    const [contract, setContract] = react_1.useState();
    const [accounts, setAccounts] = react_1.useState();
    const [l2Balance, setL2Balance] = react_1.useState();
    const [balanceOf, setBalanceOf] = react_1.useState();
    const [existingContractIdInputMessage, setExistingContractIdInputMessage] = react_1.useState();
    const [storedMessage, setStoredMessage] = react_1.useState();
    const [deployTxHash, setDeployTxHash] = react_1.useState();
    const [polyjuiceAddress, setPolyjuiceAddress] = react_1.useState();
    const [depositAddress, setDepositAddress] = react_1.useState();
    const [transactionInProgress, setTransactionInProgress] = react_1.useState(false);
    const toastId = react_1.default.useRef(null);
    const [newStoredNumberInputMessage, setNewStoredNumberInputMessage] = react_1.useState();
    react_1.useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new nervos_godwoken_integration_1.AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        }
        else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);
    react_1.useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = react_toastify_1.toast.info('Transaction in progress. Confirm MetaMask signing dialog and please wait...', {
                position: 'top-right',
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                closeButton: false
            });
        }
        else if (!transactionInProgress && toastId.current) {
            react_toastify_1.toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);
    const account = accounts?.[0];
    async function deployContract() {
        const _contract = new MessageCreationWrapper_1.MessageCreationWrapper(web3);
        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);
            const transactionHash = await _contract.deploy(account);
            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            react_toastify_1.toast('Successfully deployed the smart-contract. Now you can retrieve or update the message!', { type: 'success' });
        }
        catch (error) {
            console.error(error);
            react_toastify_1.toast.error('There was an error sending your transaction. Please check developer console.');
        }
        finally {
            setTransactionInProgress(false);
        }
    }
    async function getStoredMessage() {
        const message = await contract.getStoredMessage(account);
        react_toastify_1.toast('Successfully read latest message.', { type: 'success' });
        setStoredMessage(message);
    }
    async function setExistingContractAddress(contractAddress) {
        const _contract = new MessageCreationWrapper_1.MessageCreationWrapper(web3);
        _contract.useDeployed(contractAddress.trim());
        setContract(_contract);
        setStoredMessage(undefined);
    }
    async function setNewStoredMessage() {
        try {
            setTransactionInProgress(true);
            await contract.setStoredMessage(newStoredNumberInputMessage, account);
            react_toastify_1.toast('You have updated the message! Try retrieving the new message.', { type: 'success' });
        }
        catch (error) {
            console.error(error);
            react_toastify_1.toast.error('There was an error sending your transaction. Please check developer console.');
        }
        finally {
            setTransactionInProgress(false);
        }
    }
    react_1.useEffect(() => {
        if (web3) {
            return;
        }
        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);
            const _accounts = [window.ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });
    const getSUDTBalance = async () => {
        const contract = new web3.eth.Contract(CompiledContractArtifact.abi, SUDT_Proxy);
        const _balanceOf = await contract.methods.balanceOf(polyjuiceAddress).call({
            from: accounts?.[0]
        });
        console.log('BALACE::', _balanceOf);
        setBalanceOf(_balanceOf);
    };
    const redirect = () => {
        window.location.href = force_bridge;
    };
    const generateLayer2DepositAddress = async () => {
        const addressTranslator = new nervos_godwoken_integration_1.AddressTranslator();
        const _depositAddress = await addressTranslator.getLayer2DepositAddress(web3, accounts?.[0]);
        console.log(`Layer 2 Deposit Address on Layer 1: \n${_depositAddress.addressString}`);
        setDepositAddress(_depositAddress.addressString);
        getSUDTBalance();
    };
    const LoadingIndicator = () => react_1.default.createElement("span", { className: "rotating-icon" }, "\u2699\uFE0F");
    return (react_1.default.createElement("div", null,
        "Nervos Layer 2 balance:",
        ' ',
        react_1.default.createElement("b", null,
            l2Balance ? (l2Balance / 10n ** 8n).toString() : react_1.default.createElement(LoadingIndicator, null),
            " CKB"),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        "Deployed contract address: ",
        react_1.default.createElement("b", null, contract?.address || '-'),
        " ",
        react_1.default.createElement("br", null),
        "Deploy transaction hash: ",
        react_1.default.createElement("b", null, deployTxHash || '-'),
        react_1.default.createElement("br", null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("button", { onClick: deployContract, disabled: !l2Balance }, "Deploy contract"),
        "\u00A0or",
        react_1.default.createElement("input", { placeholder: "Pre-existing contract", onChange: e => setExistingContractIdInputMessage(e.target.value) }),
        react_1.default.createElement("button", { disabled: !existingContractIdInputMessage || !l2Balance, onClick: () => setExistingContractAddress(existingContractIdInputMessage) }, "Use existing contract"),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("button", { onClick: getStoredMessage, disabled: !contract }, "Retreive stored message"),
        storedMessage ? react_1.default.createElement(react_1.default.Fragment, null,
            "\u00A0\u00A0Stored message: ",
            storedMessage) : null,
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("input", { type: "text", onChange: e => setNewStoredNumberInputMessage(e.target.value) }),
        react_1.default.createElement("button", { onClick: setNewStoredMessage, disabled: !contract }, "Change message."),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("hr", null),
        "Your ETH address: ",
        react_1.default.createElement("b", null, accounts?.[0]),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        !depositAddress && (react_1.default.createElement("button", { onClick: generateLayer2DepositAddress }, "Get Layer 2 Deposit Address")),
        react_1.default.createElement("br", null),
        react_1.default.createElement("div", null,
            "Your Layer 2 Deposit Address on Layer 1:",
            depositAddress),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("button", { onClick: redirect }, " Get sent to the Force Bridge"),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        "Place the Layer 2 Deposit Address as the recipient on the Force Bridge.",
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        "Your Polyjuice address: ",
        react_1.default.createElement("b", null, polyjuiceAddress || ' - '),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement(react_toastify_1.ToastContainer, null)));
}
exports.App = App;
//# sourceMappingURL=app.js.map