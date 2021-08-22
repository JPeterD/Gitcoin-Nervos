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

import { MessageCreationWrapper } from '../lib/contracts/MessageCreationWrapper';
import { CONFIG } from '../config';
import * as ERC20 from '../../build/contracts/ERC20.json';

async function createWeb3() {
    // Modern dapp browsers...
    const { ethereum } = window as any;
    if (ethereum && ethereum.isMetaMask) {
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
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedMessage, setStoredMessage] = useState<string | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredMessageInputValue, setNewStoredMessageInputValue] = useState<
        string | undefined
    >();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [sudtBalance, setSudtBalance] = useState<string>();

    useEffect(() => {
        (async () => {

            if (accounts?.[0]) {
                const addressTranslator = new AddressTranslator();
                setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
                const _polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(
                    accounts?.[0]
                );
                const sudtContract = new web3.eth.Contract(
                    ERC20.abi as never,
                    CONFIG.SUDT_PROXY_CONTRACT_ADDRESS
                );
                const balance = await sudtContract.methods.balanceOf(_polyjuiceAddress).call({
                    from: accounts?.[0]
                });
                setSudtBalance(balance);

                addressTranslator
                    .getLayer2DepositAddress(web3, (window as any).ethereum.selectedAddress)
                    .then(depositAddr => {
                        setDepositAddress(depositAddr.addressString);
                    });
            } else {
                setPolyjuiceAddress(undefined);
            }
        })();
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
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
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
        toast('Successfully read latest stored message.', { type: 'success' });

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
            await contract.setStoredMessage(newStoredMessageInputValue, account);
            toast(
                'Successfully set latest stored value. You can refresh the read value now manually.',
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

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Layer 2 ckETH Balance: {' '}
            <b>{sudtBalance ? sudtBalance.toString() : <LoadingIndicator />} ckETH WEI</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={getStoredMessage} disabled={!contract}>
                Get stored message
            </button>
            {storedMessage ? <>&nbsp;&nbsp;Stored message: {storedMessage.toString()}</> : null}
            <br />
            <br />
            <input
                type="text"
                onChange={e => setNewStoredMessageInputValue(e.target.value)}
            />
            <button onClick={setNewStoredMessage} disabled={!contract}>
                Set new stored Message
            </button>
            <br />
            <br />
            L2 Deposit address: <b>{depositAddress || ' - '}</b>
            <br />
            <br />
            Deposit to the layer 2 with this link:{' '}
            <a href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos">Force Bridge</a>
            . The receipient would be your Layer 2 Deposit address above.
            <br />
            <br />
            <br />
            <ToastContainer />
        </div>
    );
}