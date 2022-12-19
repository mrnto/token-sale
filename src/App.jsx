import { useEffect, useState } from "react";
import Web3 from "web3";
import { ABI, ADDRESS } from "./abi";
import { shortenAddress } from "./utils";
import logo from "./assets/logo.svg";

const Loader = () => (
  <div className="flex justify-center items-center mt-5">
    <div className="border-t-transparent border-solid border-blue-600 animate-spin w-12 h-12 border-4 rounded-full"></div>
  </div>
);

export default function App() {
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [supply, setSupply] = useState(0);
  const [purchased, setPurchased] = useState(0);
  const [investorAmount, setInvestorAmount] = useState(0);
  const [ethValue, setEthValue] = useState(null);
  const [percent, setPercent] = useState(0);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    window?.ethereum?.on('accountsChanged', () => window.location.reload());
    window?.ethereum?.on('chainChanged', () => window.location.reload());
    window?.ethereum?.on('disconnect', () => window.location.reload());
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
    const contract = new web3.eth.Contract(ABI, ADDRESS);

    setWeb3(web3);
    setContract(contract);
  }, []);

  useEffect(() => {
    const getContractData = async () => {
      await contract.methods.rate().call()
        .then(res => setRate(Number(res)));
      await contract.methods.minWei().call()
        .then(res => setMin(Number(Web3.utils.fromWei(res, 'ether'))));
      await contract.methods.maxWei().call()
        .then(res => setMax(Number(Web3.utils.fromWei(res, 'ether'))));
      await contract.methods.tokenPurchased().call()
        .then(res => setPurchased(Number(Web3.utils.fromWei(res, 'ether'))));
      await contract.methods.supply().call()
        .then(res => setSupply(Number(Web3.utils.fromWei(res, 'ether'))));
    }

    if(contract) {
      getContractData();
    }
  }, [contract]);

  useEffect(() => {
    const getContractData = async () => {
      await contract.methods.investors(account).call()
        .then(res => setInvestorAmount(Number(Web3.utils.fromWei(res, 'ether'))));
    }

    if (account && contract) {
      getContractData();
    }
  }, [account, contract]);

  useEffect(() => {
    const countPercent = () => {
      let p = purchased*100/supply;
      if (p !== p || p == Infinity) return 0;
      return p;
    }
    
    setPercent(countPercent());
  }, [supply, purchased]);

  const buyTokens = async () => {
    if (ethValue == null) return;

    if (ethValue < min) {
      alert(`Minimum amount is ${min} ETH`);
      return;
    }
    
    if (ethValue > max) {
      alert(`Maximum amount is ${max} ETH`);
      return;
    }
    
    if ((Number(ethValue) + investorAmount) > max) {
      alert(`Maximum ${max} ETH per account`);
      return;
    }

    const value = Web3.utils.toWei(ethValue, 'ether');

    try {
      setLoading(true);
      const tx = await contract.methods.buyTokens().send({ from: account, value: value });
      const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);

      if (receipt.status) {
        setInvestorAmount(investorAmount + Number(ethValue));
        setPurchased(purchased + (ethValue * rate));
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="w-full flex md:justify-center justify-between items-center p-4">
        <div className="md:flex-[0.5] flex-initial justify-center items-center">
          <span className="text-white	text-xl font-semibold">
            <img src={logo} alt="logo" className="inline w-16" />
            Super Token
          </span>
        </div>
        <div className="text-white md:flex flex-row justify-between items-center flex-initial">
          {!account ?
            <button onClick={connectWallet} className="bg-[#2952e3] py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd]">
              Connect
            </button>
            :
            <p className="text-lg text-white py-1">
              {shortenAddress(account)}
            </p>
          }
        </div>
      </nav>
      <div className="flex w-full justify-center items-center">
        <div className="flex mf:flex-row items-start justify-between md:p-20 py-12 px-4">
          <div className="flex flex-1 justify-start items-start flex-col mr-14 mf:mr-10">
            <h1 className="text-3xl sm:text-5xl text-white py-1">
              Super Token <br/> Best token ever
            </h1>
            <p className="text-left mt-5 text-white font-light md:w-9/12 w-11/12 text-base">
              Public sale of innovation token. Buy now.
            </p>
          </div>
          <div className="flex flex-col flex-1 items-center justify-start w-full">
            <div className="p-5 sm:w-96 w-full flex flex-col justify-start items-center blue-block">
              <p className="text-white font-medium text-base my-1">
                Available {supply-purchased} of {supply}.
              </p>
              <div className="w-full mb-3 bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div style={{width: `${percent}%`}} className="bg-blue-600 h-4 rounded-full"></div>
              </div>
              <div className="h-[1px] w-full bg-gray-400 my-2" />
              <input
                onChange={(e) => setEthValue(e.target.value)}
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                placeholder="Amount (ETH)"
                className="my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-sm white-block"
              />
              <p className="text-white font-medium text-sm my-1">
                You will get {(ethValue*rate).toFixed(0)} tokens.
              </p>

              {loading
                ? <Loader />
                : (
                  <button
                    onClick={buyTokens}
                    disabled={account == undefined ? true : false}
                    type="button"
                    className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full cursor-pointer"
                  >
                    Buy
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
