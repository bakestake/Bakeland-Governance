// 0x6352211e - ownerof


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
const itemAbi = require('../artifacts/itemAbi')


const assetOwnerShipCcq = async (contractAddress, tokenId) => {
  try {
    const selector = "0x6352211e";
    const chains = [
      { chains: "arbSepolia", chainId: 10003, rpc: getProviderURLs("arbSepolia") },
    ];

    const nftInst = new ethers.Contract(contractAddress, itemAbi, new ethers.JsonRpcProvider(getProviderURLs("arbSepolia")))

    // validate if tokenId exists or not

    try{
      const owner = nftInst.ownerOf(tokenId);
    }catch(error){
      return `Unable to fetch ownership data for token id : ${tokenId}, Make sure it is existant`;
    }
    


    console.log("Eth calls and block number calls getting recorded");

    const encoder = ethers.AbiCoder.defaultAbiCoder();

    const funcCallData = ethers.concat([
        selector, 
        encoder.encode(['uint256'], [tokenId])
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

    console.log("Preparing eth call data");

    const callData = {
      to: contractAddress,
      data: funcCallData,
    };

    console.log("Preparing queries for all chains");

    console.log(responses[0]?.data?.[0]?.result)

    let perChainQueries = chains.map(({ chainId }, idx) => {
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
      10003: getProviderURLs("arbSepolia") 
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

module.exports = assetOwnerShipCcq