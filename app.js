require('dotenv').config(); // load from .env automatically
const express = require("express");
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

const artifact = require('./contract.json');
const ethers = require("ethers");

const tokenAddress = "0xb8b7Fd8003d0c975694F4c7A348a2946fEE4E33B";

app.post("/rebase", async (req, res) => {

  // parameters: 
  // new supply / demand ratio
  // demo accounts
  const accounts = req.body.accounts;
  const ratio = req.body.ratio;
  
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);

  const supply = await contract.totalSupply();
  const newSupply = supply * (ratio - 1);
  if (newSupply > supply) {
    const diff = newSupply - supply;
    const mintPerAccount = diff / (accounts.length + 1);
    for (const acc of accounts) {
      await contract.mintTo(acc, mintPerAccount);
    }
    await contract.mintTo(tokenAddress, mintPerAccount)
  }

  res.json({'result': true})

});


app.post('/init-airdrop', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);
  const accounts = req.body.accounts;
  for (const acc of accounts) {
      await contract.mintTo(acc, ethers.parseUnits('1000', 18));
    }
    await contract.mintTo(tokenAddress, ethers.parseUnits('1000', 18));
  res.json({'result': true})
});

app.post('/increase-supply', async (req, res) => {
  const accounts = req.body.accounts;
  let pct;
  try {
    pct = parseInt(req.body.pct);
  } catch (e) {
    return res.status(400).json({ error: "no valid pct value" });
  }
  
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);

  const supply = await contract.totalSupply();
  const extraSupply = supply * pct / 100;
  const mintPerAccount = extraSupply / (accounts.length + 1);
  for (const acc of accounts) {
      await contract.mintTo(acc, mintPerAccount);
    }
  await contract.mintTo(tokenAddress, mintPerAccount)

  res.json({'result': true})

});


app.post('/balances', async (req, res) => {
  try {
    console.log("Received body:", req.body);

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

    if (!Array.isArray(req.body.accounts)) {
      return res.status(400).json({ error: "'accounts' must be an array" });
    }

    let result = [];
    for (const acc of req.body.accounts) {
      const bal = await provider.getBalance(acc);
      result.push(bal.toString());
    }

    res.json({ balances: result });

  } catch (error) {
    console.error("Error in /balances:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
