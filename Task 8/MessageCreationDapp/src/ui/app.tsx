/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';
import { MessageCreationWrapper } from '../lib/contracts/MessageCreationWrapper';
import { CONFIG } from '../config';
const force_bridge = 'https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos';
const SUDT_Proxy = '0xD3Dc1fBfF0949290d7227856481cC7fEF2caFd54';
async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<MessageCreationWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [balanceOf, setBalanceOf] = useState<bigint>();
    const [existingContractIdInputMessage, setExistingContractIdInputMessage] = useState<string>();
    const [storedMessage, setStoredMessage] = useState<string | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputMessage, setNewStoredNumberInputMessage] = useState<
        string | undefined
    >();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));

        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new MessageCreationWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed the smart-contract. Now you can retrieve or update the message!',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getStoredMessage() {
        const message = await contract.getStoredMessage(account);
        toast('Successfully read latest message.', { type: 'success' });

        setStoredMessage(message);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new MessageCreationWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredMessage(undefined);
    }

    async function setNewStoredMessage() {
        try {
            setTransactionInProgress(true);
            await contract.setStoredMessage(newStoredNumberInputMessage, account);
            toast(
                'You have updated the message! Try retrieving the new message.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const getSUDTBalance = async () => {
        const contract = new web3.eth.Contract(
            CompiledContractArtifact.abi as any,
            SUDT_Proxy
        );

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

        const addressTranslator = new AddressTranslator();
        const _depositAddress = await addressTranslator.getLayer2DepositAddress(
            web3,
            accounts?.[0]
        );

        console.log(`Layer 2 Deposit Address on Layer 1: \n${_depositAddress.addressString}`);

        setDepositAddress(_depositAddress.addressString);

        getSUDTBalance();
    };

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />

            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or
            <input
                placeholder="Pre-existing contract"
                onChange={e => setExistingContractIdInputMessage(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputMessage || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputMessage)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={getStoredMessage} disabled={!contract}>
                Retreive stored message
            </button>
            {storedMessage ? <>&nbsp;&nbsp;Stored message: {storedMessage}</> : null}
            <br />
            <br />
            <input
                type="text"
                onChange={e => setNewStoredNumberInputMessage(e.target.value)}
            />
            <button onClick={setNewStoredMessage} disabled={!contract}>
                Change message.
            </button>
            <br />
            <br />
            <br />
            <br />
            <hr />
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            {!depositAddress && (
                    <button onClick={generateLayer2DepositAddress}>
                        Get Layer 2 Deposit Address
                    </button>
                )}
            <br />
            <div>
            Your Layer 2 Deposit Address on Layer 1:
            {depositAddress}
            </div>
            <br />
            <br />
            <button onClick={redirect}> Get sent to the Force Bridge</button>
            <br />
            <br />
            Place the Layer 2 Deposit Address as the recipient on the Force Bridge.
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            <ToastContainer />
        </div>
    );
}
