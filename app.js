require('dotenv').config(); // load from .env automatically
const express = require("express");
const cors = require('cors');
app.use(cors());
const app = express();
const port = process.env.PORT || 3001;

const artifact = require('./contract.json');
const ethers = require("ethers");

const tokenAddress = "0xb8b7Fd8003d0c975694F4c7A348a2946fEE4E33B";

app.post("/rebase", async (req, res) => {

  // parameters: 
  // new supply / demand ratio
  // demo accounts
  const accounts = req.query.accounts;
  const ratio = req.query.ratio;
  
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
  }

  res.json({'result': true})

});

app.post('/balances', async (req, res) => {
  // parameter: accountss (array of addresses)
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  let result = [];
  for (const acc of req.query.accounts) {
    result.push(await provider.getBalance(acc));
  }
  
  res.json({'balances': result});
})

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
