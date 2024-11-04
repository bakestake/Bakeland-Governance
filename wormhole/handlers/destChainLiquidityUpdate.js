const {
  EthCallQueryRequest,
  PerChainQueryRequest,
  QueryRequest,
} = require('@wormhole-foundation/wormhole-query-sdk')
const getProviderURLs = require('./getProviderUrl')
const BeraStateUpdate = require('./beraStateUpdate')
const axios = require('axios')
require('dotenv').config();

const destChainLiquidityUpdate = async (chain ) => {
  try{
    if(chain == "beraTestnet"){
      await BeraStateUpdate();
      return true
    }else{
      await stateUpdate(chain);
      return true
    }
  }catch(error){
    console.log(error);
  }
  
};

const stateUpdate = async (chain) => {
  try {
    const contractAddress = "0x29Bab8dfA5d950561a8a5ec47d1739C41024B7f7";
    const selector = "0x4269e94c";
    const chains = [
      { chains: "fuji", chainId: 6, rpc: getProviderURLs("fuji") },
      { chains: "arbSepolia", chainId: 10003, rpc: getProviderURLs("arbSepolia") },
      { chains: "amoy", chainId: 10007, rpc: getProviderURLs("amoy") },
      { chains: "bscTestnet", chainId: 4, rpc: getProviderURLs("bscTestnet") },
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
      .put("https://testnet.query.wormhole.com/v1/query", {
        bytes: Buffer.from(serialized).toString("hex"),
      }, {
        headers: { "X-API-Key": process.env.WORMHOLE_API_KEY },
      })
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
    let global = 0;

    for (let i = 0; i < responses.length; i++) {
      global += parseInt(
        (mockQueryResponse.responses[i].response)
          .results[0]
      );
    }

    const mockQueryResult = (
      mockQueryResponse.responses[0].response
    ).results[0];

    console.log(`Mock Query Result: ${mockQueryResult} (${BigInt(mockQueryResult)})`);

    const bytes = `0x${response.data.bytes}`;

    const signatures = response.data.signatures.map((s) => ({
      r: `0x${s.substring(0, 64)}`,
      s: `0x${s.substring(64, 128)}`,
      v: `0x${(parseInt(s.substring(128, 130), 16) + 27).toString(16)}`,
      guardianIndex: `0x${s.substring(130, 132)}`,
    }));

    console.log(global / 1e18, typeof global);

    let currentState = 0;

    const contractInst = new ethers.Contract(
      "0x29Bab8dfA5d950561a8a5ec47d1739C41024B7f7",
      [
        {
          inputs: [],
          name: "getGlobalStakedBuds",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      new ethers.Wallet(
        process.env.PRIVATE_KEY || "",
        new ethers.JsonRpcProvider(await getProviderURLs(chain) || "")
      )
    );

    currentState = await contractInst.getGlobalStakedBuds();

    const parsedState = parseInt(currentState.toString()) / 1e18;
    global = global / 1e18;

    console.log(parsedState, typeof parsedState);

    if (parsedState != global) {
      console.log("State update needed");
      const stateContractInst = new ethers.Contract(
        "0x29Bab8dfA5d950561a8a5ec47d1739C41024B7f7",
        [
          {
            inputs: [
              {
                internalType: "bytes",
                name: "response",
                type: "bytes",
              },
              {
                components: [
                  {
                    internalType: "bytes32",
                    name: "r",
                    type: "bytes32",
                  },
                  {
                    internalType: "bytes32",
                    name: "s",
                    type: "bytes32",
                  },
                  {
                    internalType: "uint8",
                    name: "v",
                    type: "uint8",
                  },
                  {
                    internalType: "uint8",
                    name: "guardianIndex",
                    type: "uint8",
                  },
                ],
                internalType: "struct IWormhole.Signature[]",
                name: "signatures",
                type: "tuple[]",
              },
            ],
            name: "updateState",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        new ethers.Wallet(
          process.env.PRIVATE_KEY || "",
          new ethers.JsonRpcProvider(getProviderURLs(chain) || "")
        )
      );

      await stateContractInst.updateState(bytes, signatures);
      console.log("State updated");
    } else {
      console.log("State update not needed");
    }
  } catch (error) {
    console.error("An error occurred during the cross-chain query process", error);
  }
};

module.exports = destChainLiquidityUpdate;