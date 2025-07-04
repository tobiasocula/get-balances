require('dotenv').config(); // load from .env automatically
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

const artifact = require('./contract.json');
const ethers = require("ethers");

const tokenAddress = "0xb8b7Fd8003d0c975694F4c7A348a2946fEE4E33B";

app.get("/rebase", async (req, res) => {
  
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);



});

app.get('/balances', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const balance = await provider.getBalance(account);
  res.json({'balance': balance});
})

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
