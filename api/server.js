const express = require("express");
const cors = require("cors");
const {
  createGelatoSmartWalletClient,
  sponsored,
  erc20,
} = require("@gelatonetwork/smartwallet");
const {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  formatEther,
  zeroAddress,
} = require("viem");
const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
require("dotenv").config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Your Sponsor API Key
const sponsorApiKey = process.env.SPONSOR_API_KEY;

// Fetch Balance endpoint
app.post("/api/fetch-balance", async (req, res) => {
  try {
    const privateKey = req.body.privateKey;
    const account = privateKeyToAccount(privateKey);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    const balance = await publicClient.getBalance({ address: account.address });
    res.json({ balance: formatEther(balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/create-account", async (req, res) => {
  try {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    res.json({ privateKey: privateKey, address: account.address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send Transaction endpoint
app.post("/api/send-transaction", async (req, res) => {
  try {
    const privateKey = req.body.privateKey;
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const smartWalletClient = await createGelatoSmartWalletClient(client, {
      apiKey: sponsorApiKey,
    });
    const response = await smartWalletClient.execute({
      payment: sponsored(),
      calls: [
        {
          to: zeroAddress,
          data: "0x",
          value: 0n,
        },
      ],
    });

    const txHash = await response.wait();

    res.json({
      gelatoId: response.id,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const usdcContract = {
  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  abi: [
    {
      name: "transfer",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ],
};

app.post("/api/send-transaction-erc20", async (req, res) => {
  try {
    const privateKey = req.body.privateKey;
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const tokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const smartWalletClient = await createGelatoSmartWalletClient(client, {
      apiKey: sponsorApiKey,
    });
    const response = await smartWalletClient.execute({
      payment: erc20(tokenAddress),
      calls: [
        {
          to: zeroAddress,
          data: "0x",
          value: 0n,
        },
      ],
    });

    const txHash = await response.wait();

    res.json({
      gelatoId: response.id,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/fetch-balance-erc20", async (req, res) => {
  try {
    const privateKey = req.body.privateKey;
    const account = privateKeyToAccount(privateKey);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    const balance = await publicClient.readContract({
      address: usdcContract.address,
      abi: usdcContract.abi,
      functionName: "balanceOf",
      args: [account.address],
    });
    res.json({ balance: Number(balance) / 10 ** 6 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/send-transaction-native", async (req, res) => {
  try {
    const privateKey = req.body.privateKey;
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const smartWalletClient = await createGelatoSmartWalletClient(client, {
      apiKey: sponsorApiKey,
    });
    const response = await smartWalletClient.execute({
      payment: native(),
      calls: [
        {
          to: zeroAddress,
          data: "0x",
          value: 0n,
        },
      ],
    });

    const txHash = await response.wait();

    res.json({
      gelatoId: response.id,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
