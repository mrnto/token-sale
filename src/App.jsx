import { useEffect, useState } from "react";
import Web3 from "web3";
import { abi as ABI, address as ADDRESS } from "./abi/Crowdsale.json";
import { fromWei, toWei } from "./utils/web3-utils";
import { About, Header, Loader } from "./components";

const defaultContractData= {
    rate: 0,
    min: 0,
    max: 0,
    supply: 0,
    purchased: 0
};

export default function App() {
    const [account, setAccount] = useState("");
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [contractData, setContractData] = useState(defaultContractData);
    const [accountAmount, setAccountAmount] = useState(0);
    const [barPercent, setBarPercent] = useState(0);
    const [ethValue, setEthValue] = useState(null);
    const [loading, setLoading] = useState(false);

    const connectWallet = async () => {
        if (!window.ethereum) return alert("Please install MetaMask.");

        await window.ethereum
            .request({ method: "eth_requestAccounts" })
            .then((accounts) => setAccount(accounts[0]))
            .catch((error) => console.log(error));
    };

    const checkIfWalletIsConnected = async () => {
        if (!window.ethereum) return;

        await window.ethereum
            .request({ method: "eth_accounts" })
            .then((accounts) => {
                if (accounts.length) setAccount(accounts[0]);
            })
            .catch((error) => console.log(error));
    };

    useEffect(() => {
        checkIfWalletIsConnected();

        window.ethereum?.on("accountsChanged", () => window.location.reload());
        window.ethereum?.on("chainChanged", () => window.location.reload());
        window.ethereum?.on("disconnected", () => window.location.reload());
    }, []);

    useEffect(() => {
        const setWeb3AndContract = async () => {
            const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
            const contract = new web3.eth.Contract(ABI, ADDRESS);

            setWeb3(web3);
            setContract(contract);
        };

        setWeb3AndContract();
    }, []);

    useEffect(() => {
        const getContractData = async () => {
            await contract.methods.rate().call()
                .then((res) => {
                    setContractData((prevState) => ({
                        ...prevState,
                        rate: Number(res)
                    }));
                });
            await contract.methods.minWei().call()
                .then((res) => {
                    setContractData((prevState) => ({
                        ...prevState,
                        min: Number(fromWei(res))
                    }));
                });
            await contract.methods.maxWei().call()
                .then((res) => {
                    setContractData((prevState) => ({
                        ...prevState,
                        max: Number(fromWei(res))
                }));
            });
            await contract.methods.supply().call()
                .then((res) => {
                    setContractData((prevState) => ({
                        ...prevState,
                        supply: Number(fromWei(res))
                }));
            });
            await contract.methods.tokenPurchased().call()
                .then((res) => {
                    setContractData((prevState) => ({
                        ...prevState,
                        purchased: Number(fromWei(res))
                }));
            });
        };

        if (contract) getContractData();
    }, [contract]);

    useEffect(() => {
        const countBarPercent = () => {
            let p = contractData.purchased * 100 / contractData.supply;
            if (p !== p || p == Infinity) return 0;
            return p;
        };

        if (contractData) setBarPercent(countBarPercent());
    }, [contractData]);

    useEffect(() => {
        const getAccountData = async () => {
            await contract.methods.investors(account).call()
                .then((res) => {
                    setAccountAmount(Number(fromWei(res)));
                });
        };

        if (account && contract) getAccountData();
    }, [account, contract]);

    useEffect(() => {
        if (accountAmount && contract && contractData) {
            const listener = contract.events.allEvents({
                filter: { user: account }
            });

            listener.on("data", (event) => {
                if (event.event === "TokenPurchase") {
                    const amount = Number(fromWei(event.returnValues.tokenAmount));
                    setAccountAmount(accountAmount + (amount / contractData.rate));
                    setContractData((prevState) => ({
                        ...prevState,
                        purchased: contractData.purchased + amount
                    }));
                }
            });

            return () => listener.unsubscribe();
        }
    }, [accountAmount, contract, contractData]);

    const buyTokens = async () => {
        if (ethValue == null) return;

        if (ethValue < contractData.min)
            return alert(`Minimum amount is ${contractData.min} ETH`);

        if (ethValue > contractData.max)
            return alert(`Maximum amount is ${contractData.max} ETH`);

        if ((Number(ethValue) + accountAmount) > contractData.max)
            return alert(`Maximum ${contractData.max} ETH per account`);

        const value = toWei(ethValue);

        try {
            setLoading(true);
            await contract.methods.buyTokens().send({ from: account, value: value });
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Header account={account} connectWallet={connectWallet} />
            <div className="flex w-full justify-center items-center">
                <div className="flex mf:flex-row items-start justify-between md:p-20 py-12 px-4">
                    <About />
                    <div className="flex flex-col flex-1 items-center justify-start w-full">
                        <div className="p-5 sm:w-96 w-full flex flex-col justify-start items-center blue-block">
                            <p className="text-white font-medium text-base my-1">
                                Available {contractData.supply - contractData.purchased} of {contractData.supply}.
                            </p>
                            <div className="w-full mb-3 bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                                <div style={{ width: `${barPercent}%` }} className="bg-blue-600 h-4 rounded-full"></div>
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
                                You will get {(ethValue * contractData.rate).toFixed(0)} tokens.
                            </p>

                            {loading
                                ? <Loader />
                                : (
                                    <button
                                        onClick={buyTokens}
                                        disabled={account == undefined ? true : false}
                                        type="button"
                                        className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full"
                                    >
                                        Buy
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
