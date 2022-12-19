module.exports = {
  build_directory: "./truffle/build",
  contracts_directory: "./truffle/contracts",
  contracts_build_directory: "./truffle/build/contracts",
  migrations_directory: "./truffle/migrations",
  test_directory: "./truffle/test",
  networks: {
    development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.16",
      settings: {
       optimizer: {
         enabled: false,
         runs: 200
       }
      }
    }
  }
};
