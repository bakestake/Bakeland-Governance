const ethers = require("ethers");
const getProviderURLs  = require("./getProviderUrl");
const ABI  = require('../artifacts/getterSetter');
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const BeraStateUpdate = async () => {
  console.log("Updating Bera");

  const chains = [
    { chains: "fuji", chainId: 6, rpc: getProviderURLs("fuji") },
    { chains: "arbSepolia", chainId: 10003, rpc: getProviderURLs("arbSepolia") },
    { chains: "amoy", chainId: 10007, rpc: getProviderURLs("amoy") },
    { chains: "bscTestnet", chainId: 4, rpc: getProviderURLs("bscTestnet") },
    { chains: "beraTestnet", chainId: 39, rpc: getProviderURLs("beraTestnet") },
    // { chains: "coreTestnet", chainId: 4, rpc: getProviderURLs("coreTestnet") },
    { chains: "baseSepolia", chainId: 10004, rpc: getProviderURLs("baseSepolia") },
  ];

  console.log("Getting responses from all chains");

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
                params: [
                  {
                    to: "0x29Bab8dfA5d950561a8a5ec47d1739C41024B7f7",
                    data: "0x4269e94c",
                  },
                  "latest",
                ],
              },
            ])
            .catch((error) => {
              console.error(`Error fetching data for rpc: ${rpc}`, error);
              return null;
            })
        : Promise.reject(new Error(`RPC URL is undefined for chain ${chainId}`))
    )
  );

  console.log("Summing up global");

  let globalBudsCount = 0;

  for (let i = 0; i < responses.length; i++) {
    console.log(parseInt(responses[i]?.data?.[0]?.result?.number));
    globalBudsCount += parseInt(responses[i]?.data?.[0]?.result?.number);
  }

  console.log(globalBudsCount);

  console.log("Updating Bera state");

  const setterInst = new ethers.Contract(
    "0x29Bab8dfA5d950561a8a5ec47d1739C41024B7f7",
    ABI,
    new ethers.Wallet(
      process.env.STATE_PRIVATE_KEY || "",
      new ethers.JsonRpcProvider(await getProviderURLs("beraTestnet") || "")
    )
  );

  console.log("Doing transaction");

  const tx = await setterInst.setGlobalStakedBuds(globalBudsCount);

  await tx.wait();
};

module.exports = BeraStateUpdate;
