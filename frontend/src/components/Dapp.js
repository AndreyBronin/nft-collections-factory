import React from "react";

import { ethers } from "ethers";

import CollectionFactoryArtifact from "../contracts/CollectionFactory.json";

import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { CreateCollection } from "./CreateCollection";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { Collection } from "./Collection";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = '31337';
const API_URL = 'http://localhost:3001';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      collections: [],
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }


    if (!this.state.selectedAddress) { // || this.state.collections.length === 0
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
        <div className="container p-4">
          <div className="row">
            <div className="col-12">
              <p>
                Welcome <b>{this.state.selectedAddress}</b>
              </p>
            </div>
          </div>

          <hr/>

          <div className="row">
            <div className="col-12">
              {/*
              Sending a transaction isn't an immediate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
              {this.state.txBeingSent && (
                  <WaitingForTransactionMessage txHash={this.state.txBeingSent}/>
              )}

              {/*
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
              {this.state.transactionError && (
                  <TransactionErrorMessage
                      message={this._getRpcErrorMessage(this.state.transactionError)}
                      dismiss={() => this._dismissTransactionError()}
                  />
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <CreateCollection
                  createCollection={(name, symbol) =>
                      this._createCollection(name, symbol)
                  }
              />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              {this.state.collections.map((c, index) => {
                return <Collection
                    key={index}
                    collectionAddress={c.address}
                    name={c.name}
                    symbol={c.symbol}
                    nfts={c.nfts}
                    mintNft={(collectionAddress) => this._mintNft(collectionAddress)}
                >
                </Collection>
              })}
            </div>
          </div>
        </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({method: 'eth_requestAccounts' });

    // Once we have the address, we can initialize the application.

    // First we check the network
    this._checkNetwork();

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._collectionFactory = new ethers.Contract(
        contractAddress.CollectionFactory,
        CollectionFactoryArtifact.abi,
        this._provider.getSigner(0)
    );
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._pollServer(), 1000);
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async fetchJson(utl) {
    const response = await fetch(utl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    return response.json()
  }

  async _pollServer() {
    const nfts = await this.fetchJson(`${API_URL}/nfts`)
    const collections = await this.fetchJson(`${API_URL}/collections`)

    const collectionsWithNfts = collections.map(c => {
      return {...c, nfts: nfts.filter(n => n.address === c.address)}
    })

    this.setState({ collections: collectionsWithNfts });
  }


  async _createCollection(name, symbol) {
    try {
      this._dismissTransactionError();

      const tx = await this._collectionFactory.createCollection(name, symbol);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _mintNft(collectionAddress) {
    try {
      this._dismissTransactionError();

      const tx = await this._collectionFactory.mint(collectionAddress);

      this.setState({txBeingSent: tx.hash});

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
        this.setState({ txBeingSent: undefined });
      }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}
