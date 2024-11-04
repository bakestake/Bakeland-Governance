const {
  EthCallQueryRequest,
  PerChainQueryRequest,
  QueryRequest,
} = require('@wormhole-foundation/wormhole-query-sdk')
const axios = require('axios')
const getProviderURLs = require('./getProviderUrl')
require('dotenv').config();


const farmerTokenIDCcq = async () => {
  try {
    const contractAddress = "0xB2A338Fb022365Aa40a2c7ADA3Bbf1Ae001D6dbe";
    const selector = "0xcaa0f92a";
    const chains = [
      { chains: "fuji", chainId: 6, rpc: getProviderURLs("fuji") },
      { chains: "arbSepolia", chainId: 10003, rpc: getProviderURLs("arbSepolia") },
      { chains: "amoy", chainId: 10007, rpc: getProviderURLs("amoy") },
      { chains: "bscTestnet", chainId: 4, rpc: getProviderURLs("bscTestnet") },
      // { chains: "beraTestnet", chainId: 39, rpc: getProviderURLs("beraTestnet") },
      // { chains: "coreTestnet", chainId: 4, rpc: getProviderURLs("coreTestnet") },
      { chains: "baseSepolia", chainId: 10004, rpc: getProviderURLs("baseSepolia") },
    ];

    console.log("Eth calls and block number calls getting recorded");

    const responses = await Promise.all(
      chains.map(({ rpc, chainId }) =>
        rpc
          ? axios
              .post(rpc, [
                {
                  jsonrpc: "2.0",
                  id: 1,
                  method: "eth_getBlockByNumber",
                  params: ["latest", false],
                },
                {
                  jsonrpc: "2.0",
                  id: 2,
                  method: "eth_call",
                  params: [{ to: contractAddress, data: selector }, "latest"],
                },
              ])
              .catch((error) => {
                console.error(`Error fetching data for rpc: ${rpc}`, error);
                return null;
              })
          : Promise.reject(new Error(`RPC URL is undefined for chain ${chainId}`))
      )
    );

    console.log("Preparing eth call data");

    const callData = {
      to: contractAddress,
      data: selector,
    };

    console.log("Preparing queries for all chains");

    let perChainQueries = chains.map(({ chainId }, idx) => {
      if (!responses[idx] || !responses[idx]?.data) {
        console.error(`no response data for chain ID: ${chainId}`);
        throw new Error(`no response data for chain ID: ${chainId}`);
      }
      return new PerChainQueryRequest(
        chainId,
        new EthCallQueryRequest(responses[idx]?.data?.[0]?.result?.number, [callData])
      );
    });

    const nonce = 2;
    const request = new QueryRequest(nonce, perChainQueries);
    const serialized = request.serialize();

    console.log("Querying cross chain");

    const response = await axios
      .put(
        "https://testnet.query.wormhole.com/v1/query",
        {
          bytes: Buffer.from(serialized).toString("hex"),
        },
        { headers: { "X-API-Key": process.env.WORMHOLE_API_KEY } }
      )
      .catch((error) => {
        console.error("error querying cross chain", error);
        throw error;
      });

    const bytes = `0x${response.data.bytes}`;

    const signatures = response.data.signatures.map((s) => ({
      r: `0x${s.substring(0, 64)}`,
      s: `0x${s.substring(64, 128)}`,
      v: `0x${(parseInt(s.substring(128, 130), 16) + 27).toString(16)}`,
      guardianIndex: `0x${s.substring(130, 132)}`,
    }));

    return {
        "bytes" : bytes,
        "sig" : signatures
    }

   
  } catch (Error) {
    console.error("an error occurred during the cross-chain query process", Error);
  }
};

module.exports = farmerTokenIDCcq