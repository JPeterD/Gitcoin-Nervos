
# Task 12 - Porting a Dapp on Ethereum over to Polyjuice

This article will will guide how to port over an exisiting Ethereum Dapp over to the Nervos Polyjuice. Hope this article will help you participate in the Nervos Ecosystem.
---
## 1) Setup Metamask RPC
For the Dapp to be compatible with Metamask you have to configure it to communicate with the Godwoken Layer 2 Network. You are able to do this using the "Custom RPC" on Metamask.

![Metamask](./metamaskrpc.png)

You are now able to fill in the fields with the following information:
```
Network Name: Godwoken Testnet
RPC URL: https://godwoken-testnet-web3-rpc.ckbapp.dev
Chain ID: 71393
Currency Symbol: N/A
Block Explorer URL: N/A
```
---
# 2) Select Ethereum DApp
Now you would like to search for an exisiting Ethereum DApp you would like to port over to Polyjuice. You can also make you own Ethereum DApp then port it over yourself ater.

Once you have found or created the DApp you would like to port over you can now clone its repository.

In our case lets clone this Sample application here:
```
git clone https://github.com/JPeterD/SampleDapp
````
Now move inside its directory and install all of its dependencies, build the smart contract and start up Ganache.
Inside a different terminal start up the UI of the DApp.
```
yarn ui
```
Once it has been started try going to http://localhost:3000 to view the current DApp.

---
# 3) Installing Dependencies & Configuring Values
We will now begin with the porting, first of all you are supposed to install the dependencies that are required to work with Polyjuice and Godwoken. So inside of your DApp directory use the command below to install the dependencies:
```
yarn add @polyjuice-provider/web3@0.0.1-rc7 nervos-godwoken-integration@0.0.6
```
Now we will want to modify the web3 provider for the application to a Polyjuice one. In our application this is already done but you can see where the change was made in our config.ts file.
```
export const CONFIG = {
    WEB3_PROVIDER_URL: 'https://godwoken-testnet-web3-rpc.ckbapp.dev',
    ROLLUP_TYPE_HASH: '0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a',
    ETH_ACCOUNT_LOCK_CODE_HASH: '0xdeec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b22'
};
```
The web3 provider URL should be configured to "https://godwoken-testnet-web3-rpc.ckbapp.dev". The "rollup_type_hash" and "eth_account_lock" are values that are also required you can see the needed values in the code above.

---
# 4) Importing 
Now we will want to import the dependencies we have just installed in our app.tsx file you can add the following line in your DApp:
```
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
```
Now we will be creating the Polyjuice Provider for our DApp and utilize the provider with our web3 instance.
```
const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
const providerConfig = {
    rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
    web3Url: godwokenRpcUrl
};
const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
const web3 = new Web3(provider);
```
The above code can be used to replace our current Ethereum web3 instance, so search for it in your file, delete it and replace it with the above code.

By the time you have reached the current step the DApp is already capable of communicating with Polyjuice.

---
# 5) Gas Limit
Currently Godwoken requires a high gas limit to be set for transactions on the testnet right now. *This is prone to change in the future.*

So we would just want to create a simple object that changes the gas property used by Metamask with the following code:
```
const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};
```
You can add this object in ```/src/lib/contracts/MessageCreationWrapper.ts /``` at the top.

Now you can modify the object that is passed through the send() as the default values. Example here:
```
this.contract.methods.set(value).send({
    ...DEFAULT_SEND_OPTIONS,
    from: fromAddress
});
```

---
# 6) Displaying Address in UI
Ethereum addresses can be shown as a Polyjuice address on the Layer 2, we will do this by utilizing the ```AddressTranslator``` class.
Importation: ```import { AddressTranslator } from 'nervos-godwoken-integration';``` 
You can now deduce the Polyjuice address with the code here:
```
const addressTranslator = new AddressTranslator();
const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(ethereumAddress);
```
In our DApp we displayed the actual address on our UI by implementing the following code:
```
const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();

useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));

        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

   Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
```

---
# 7) Display your DApp
Now you have finished the porting! You can now traverse to the DApp's directory and run the following commands:
```
yarn
yarn build
yarn ui
```
You can now view your DApp at http://localhost:3000/, make sure to change your MetaMask RPC as well. 

If you want to check out my Message Creation DApp I used here you can view it here:https://github.com/JPeterD/SampleDapp
