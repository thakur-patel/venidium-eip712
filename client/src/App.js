import React, { Component } from "react";
import EIP712ExampleContract from "./contracts/EIP712Example.json";
import getWeb3 from "./getWeb3";
import "./App.css";
var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

class App extends Component {

  state = { storageValue: 0, web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EIP712ExampleContract.networks[networkId];

      const instance = new web3.eth.Contract(
        EIP712ExampleContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
    }
  };

  // gets the current value of nonce
  runExample = async () => {
    const { accounts, contract } = this.state;
    const response = await contract.methods.get().call();
    this.setState({ storageValue: response });
  };

  // function to be called when 'Sign' button is clicked
  signData = async () => {
    const { web3, accounts, contract } = this.state;
    var signer = accounts[0];

    // the deadline variables are not required. It isn't negatively effecting the code too. So, it can be ignored. 
    var milsec_deadline = Date.now() / 1000 + 10000;
    console.log(milsec_deadline, "milisec");
    var deadline = parseInt(String(milsec_deadline).slice(0, 10));
    console.log(deadline, "sec");

    // x is the nonce | amount is the amount
    var x = 1;
    var amount = 100;

    // getting chainId
    web3.currentProvider.sendAsync({
      method: 'net_version',
      params: [],
      jsonrpc: "2.0"
    }, async function (err, result) {
      const netId = result.result;
      console.log("netId", netId);

      // defining the parameter to be sent to eth_signTypedData_v4
      const msgParams = JSON.stringify({types:
        {
        EIP712Domain:[
          {name:"name",type:"string"},
          {name:"version",type:"string"},
          {name:"chainId",type:"uint256"},
          {name:"verifyingContract",type:"address"}
        ],
        set:[
          {name:"nonce",type:"uint"},
          {name:"amount", type:"uint"}
        ]
      },
      primaryType:"set",
      domain:{name:"SetTest",version:"1",chainId:netId,verifyingContract:"0xC8EB945656dDaB6ACE976C8b6d507385DB43215d"},
      message:{
        nonce: x,
        amount: amount
      }
      })

      var from = signer;
    
      console.log('CLICKED, SENDING PERSONAL SIGN REQ', 'from', from, msgParams)
      var params = [from, msgParams]
      console.dir(params)
      var method = 'eth_signTypedData_v4'
    
      // calling the method eth_signTypedData_v4
      web3.currentProvider.sendAsync({
        method,
        params,
        from,
      }, async function (err, result) {
        if (err) return console.dir(err)
        if (result.error) {
          alert(result.error.message)
        }
        if (result.error) return console.error('ERROR', result)
        console.log('TYPED SIGNED:' + JSON.stringify(result.result))
    
        const recovered = sigUtil.recoverTypedSignature({ data: JSON.parse(msgParams), sig: result.result })
    
        if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
          alert('Successfully ecRecovered signer as ' + from)
        } else {
          alert('Failed to verify signer when comparing ' + result + ' to ' + from)
        }

        // getting r, s and v from signature
        const signature = result.result.substring(2);
        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = parseInt(signature.substring(128, 130), 16);
        console.log("r:", r);
        console.log("s:", s);
        console.log("v:", v);

        // ERROR IS COMING FROM CALLING THIS METHOD. 
        // Update: ERROR perists even after commenting out all the lines of the method and simply returning 0. 
        const consolog = await contract.methods.executeSetIfSignatureMatch(v,r,s,signer, deadline, amount, x).send({ from: accounts[0] });
        // const consolog = await contract.methods.executeSetIfSignatureMatch().send({ from: accounts[0] });
        console.log(consolog); // Not a part of the core logic too. I'm debugging executeSetIfSignatureMatch. 
      }) 
    })
  }
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3 Modules. This won't take long.</div>;
    }
    return (
      <div className="App">
        <h2>EIP 712 Example</h2>
        {/* <p>
          Changing the value stored in variable <strong>'x'</strong> of App.js updates the value. 
        </p>  */}
        <div>The stored nonce value is: {this.state.storageValue}</div>
        <button onClick={() => this.signData()}> Sign </button>
      </div>
    );
  }
}

export default App;
