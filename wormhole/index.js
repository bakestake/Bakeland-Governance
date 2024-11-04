const express = require('express')
const cors = require('cors')
const CCQ = require('./handlers/globalBudsHandler')
const PVP = require('./handlers/pvpHandler')
const farmerTokenIDCcq = require('./handlers/farmerTokenIdHandler')
const narcTokenIdCcq = require('./handlers/narcTokenIdHandler')
const destChainLiquidityUpdate = require('./handlers/destChainLiquidityUpdate')
const assetOwnerShipCcq = require('./handlers/assetOwnership')

const app = express();

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'API-KEY')
  next()
})

app.get("/", cors(), async (req, res) => {
  res.send("wormhole service");
});

app.use((req, res, next) => {
  const apiKey = req.get('API-KEY')
  if (!apiKey || apiKey != process.env.API_KEY) {
    console.log(process.env.API_KEY)
    res.status(401).json({error: 'unauthorised. Incorrect API key'})
  } else {
    next()
  }
})

app.get("/globalBudsCcq/:chain", cors(), async (req, res) => {
  try{
    const response = await CCQ(req.params.chain);
    res.status(200);
    res.json(response)
  }catch(error){
    console.log("Error updating global liquidity", error)
    res.status(500).json({error: `failed to perform CCQ`})
  }
});

app.get("/updateChainState/:chain", cors(), async (req, res) => {
  try{
    const response = await destChainLiquidityUpdate(req.params.chain);
    res.status(200);
    res.json({"status": response})
  }catch(error){
    console.log("Error updating global liquidity", error)
    res.status(500).json({error: `failed to perform CCQ`})
  }
});

app.get("/pvpCcq/:network", cors(), async (req, res) => {
  /// call pvp handler 
  try{
    console.log(`Querying on ${req.params.network} ....`);
    const response = await PVP(req.params.network);
    console.log(`Querying on ${req.params.network}.`);

    res.status(200);
    res.json({"status":response});
  }catch(error){
    console.log("Error querying pvp global status", error)
   res.status(500).json({error: `failed to query pvp global status on ${req.params.network}`})
  }
});

app.get("/farmerTokenIdCcq/", cors(), async (req, res) => {
  try{
    const response = await farmerTokenIDCcq();
    res.status(200);
    res.json(response);
  }catch(error){
    console.log("Error querying pvp global status", error)
   res.status(500).json({error: `failed to query pvp global status on ${req.params.network}`})
  }
});

app.get("/narcTokenIdCcq/", cors(), async (req, res) => {
  try{
    const response = await narcTokenIdCcq();
    res.status(200);
    res.json(response);
  }catch(error){
    console.log("Error querying pvp global status", error)
   res.status(500).json({error: `failed to query pvp global status on ${req.params.network}`})
  }
});

app.get("/assetOwnership/:address/:tokenID", cors(), async(req, res) => {
  try{
    const response = await assetOwnerShipCcq(req.params.address, req.params.tokenID);
    res.status(200);
    res.json(response)
  }catch(error){
    console.log("Error updating global liquidity", error)
    res.status(500).json({error: `failed to perform CCQ`})
  }
})

module.exports = app;
