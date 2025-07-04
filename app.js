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
  try {
    const { accounts, ratio } = req.body;

    if (!Array.isArray(accounts)) {
      return res.status(400).json({ error: "Accounts must be an array" });
    }

    if (isNaN(ratio)) {
      return res.status(400).json({ error: "Ratio must be a number" });
    }

    const ratioFloat = parseFloat(ratio);

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);

    const supply = await contract.totalSupply(); // BigInt
    const newSupply = BigInt(Math.floor(Number(supply) * ratioFloat));

    if (newSupply > supply) {
      const diff = newSupply - supply;
      const mintPerAccount = diff / BigInt(accounts.length + 1);

      for (const acc of accounts) {
        let tx = await contract.mintTo(acc, mintPerAccount);
        await tx.wait();
      }

      tx = await contract.mintTo(tokenAddress, mintPerAccount);
      await tx.wait();
    } else {
      return res.status(400).json({ error: "Ratio must be greater than 1" });
    }

    res.json({ result: true });

  } catch (err) {
    console.error("Error in /rebase:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/init-airdrop', async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);
  const accounts = req.body.accounts;
  for (const acc of accounts) {
      let tx = await contract.mintTo(acc, ethers.parseUnits('1000', 18));
      await tx.wait();
    }
    tx = await contract.mintTo(tokenAddress, ethers.parseUnits('1000', 18));
    await tx.wait();
  res.json({'result': true})
});

app.post('/increase-supply', async (req, res) => {
  const accounts = req.body.accounts;
  let pct = req.body.pct;
  if (isNaN(pct)) {
    return res.status(400).json({ error: "no valid pct value" });
  }
  if (!Array.isArray(accounts)) {
    return res.status(400).json({ error: "Accounts must be an array" });
  }
  pct = BigInt(Math.floor(parseFloat(req.body.pct)));
  console.log('value of pct:', pct);

  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);

  const supply = await contract.totalSupply(); // BigInt
  const extraSupply = (supply * pct) / BigInt(10000); // divide by 10000 instead of 100 to support decimal %
  const mintPerAccount = extraSupply / BigInt(accounts.length + 1);


  

  for (const acc of accounts) {
      let tx = await contract.mintTo(acc, mintPerAccount);
      await tx.wait();
    }
  tw = await contract.mintTo(tokenAddress, mintPerAccount)
  await tx.wait();

  res.json({'result': true})

});


app.post('/balances', async (req, res) => {
  try {
    console.log("Received body:", req.body);

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(tokenAddress, artifact.abi, wallet);

    if (!Array.isArray(req.body.accounts)) {
      return res.status(400).json({ error: "Accounts must be an array" });
    }

    let result = [];
    for (const acc of req.body.accounts) {
      const bal = await contract.balanceOf(acc);
      result.push(bal.toString());
    }

    res.json({ balances: result });

  } catch (error) {
    console.error("Error in /balances:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/pinging', async (req, res) => {
  res.json({result: true})
})

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
