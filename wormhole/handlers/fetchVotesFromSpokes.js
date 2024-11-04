const {
  EthCallQueryRequest,
  PerChainQueryRequest,
  QueryRequest,
  QueryResponse,
  QueryProxyMock
} = require('@wormhole-foundation/wormhole-query-sdk')
const axios = require('axios')
const getProviderURLs = require('./getProviderUrl')
require('dotenv').config();
const ethers = require('ethers')
const itemAbi = require('../artifacts/proposalVotes')


const fetchVotesFromSpokes = async (proposalId) => {
  try {
    const selector = "0x544ffc9c";
    const chains = [
      { chains: "fuji", chainId: 6, rpc: getProviderURLs("fuji"), contractAddress:"" },
      { chains: "arbSepolia", chainId: 10003, rpc: getProviderURLs("arbSepolia"), contractAddress:"" },
      { chains: "amoy", chainId: 10007, rpc: getProviderURLs("amoy"), contractAddress:"" },
      { chains: "bscTestnet", chainId: 4, rpc: getProviderURLs("bscTestnet"), contractAddress:"" },
      // { chains: "beraTestnet", chainId: 39, rpc: getProviderURLs("beraTestnet"), contractAddress:"" },
      // { chains: "coreTestnet", chainId: 4, rpc: getProviderURLs("coreTestnet"), contractAddress:"" },
      { chains: "baseSepolia", chainId: 10004, rpc: getProviderURLs("baseSepolia"), contractAddress:"" },
    ];
    
    console.log("Eth calls and block number calls getting recorded");

    const encoder = ethers.AbiCoder.defaultAbiCoder();

    const funcCallData = ethers.concat([
        selector, 
        encoder.encode(['uint256'], [proposalId])
    ])

    console.log("here querying rpc method")

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
                  params: [{ to: contractAddress, data: funcCallData }, "latest"],
                },
              ])
              .catch((error) => {
                console.error(`Error fetching data for rpc: ${rpc}`, error);
                return null;
              })
          : Promise.reject(new Error(`RPC URL is undefined for chain ${chainId}`))
      )
    );

    console.log(responses)

    console.log("Preparing queries for all chains");

    console.log(responses[0]?.data?.[0]?.result)

    let perChainQueries = chains.map(({ chainId, contractAddress }, idx) => {

        const callData = {
            to: contractAddress,
            data: funcCallData,
        };
      if (!responses[idx] || !responses[idx]?.data) {
        console.error(`no response data for chain ID: ${chainId}`);
        throw new Error(`no response data for chain ID: ${chainId}`);
      }
      return new PerChainQueryRequest(
        chainId,
        new EthCallQueryRequest(responses[idx]?.data?.[0]?.result.number, [callData])
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

    const mock = new QueryProxyMock({
      6: chains[0].rpc || "",
      10003: chains[1].rpc || "",
      10007: chains[2].rpc || "",
      4: chains[3].rpc || "",
      10004: chains[4].rpc || ""
    });
    const mockData = await mock.mock(request);
    const mockQueryResponse = QueryResponse.from(mockData.bytes);

    const mockQueryResult = (
      mockQueryResponse.responses[0].response
    ).results;

    console.log(`Mock Query Result: ${mockQueryResult}`);

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

module.exports = fetchVotesFromSpokes