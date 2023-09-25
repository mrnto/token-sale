import Web3 from "web3";

const fromWei = (wei) => Web3.utils.fromWei(wei, "ether");
const toWei = (eth) => Web3.utils.toWei(eth, "ether");

export { fromWei, toWei };