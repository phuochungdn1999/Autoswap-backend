require("dotenv").config();
const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const { ethers } = require("ethers");
const uniswapV3Factory = require("../../abi/uniswapV3Factory.json");
const uniswapV3Router = require("../../abi/uniswapV3Router.json");
const uniswapV2Factory = require("../../abi/uniswapV2Factory.json");
const uniswapV2Router = require("../../abi/uniswapV2Router.json");
const uniswapV3Quoter = require("../../abi/uniswapV3Quoter.json");

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC);
const web3 = new Web3(process.env.RPC);
const factoryContractV3 = new web3.eth.Contract(
  uniswapV3Factory,
  process.env.FACTORY_ADDRESS_V3
);
const factoryContractV2 = new web3.eth.Contract(
  uniswapV2Factory,
  process.env.FACTORY_ADDRESS_V2
);
const routerContractV3 = new web3.eth.Contract(
  uniswapV3Router,
  process.env.ROUTER_ADDRESS_V3
);
const routerContractV2 = new web3.eth.Contract(
  uniswapV2Router,
  process.env.ROUTER_ADDRESS_V2
);
const quoterUniswapV3 = new ethers.Contract(
  process.env.QUOTER_ADDRESS,
  uniswapV3Quoter,
  provider
);

const fees = [500, 3000, 10000];

async function getPair(tokenIn, tokenOut) {
  const pairAddressV2 = await factoryContractV2.methods
    .getPair(tokenIn, tokenOut)
    .call();
  console.log("12313", pairAddressV2);
  if (pairAddressV2 !== process.env.ZERO_ADDRESS) {
    return {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      poolAddress: pairAddressV2,
      fee: "3000",
      type: "v2",
    };
  }
  for (const fee of fees) {
    const pairAddressV3 = await factoryContractV3.methods
      .getPool(tokenIn, tokenOut, fee)
      .call();
    console.log(tokenOut);
    console.log(pairAddressV3);
    if (pairAddressV3 !== process.env.ZERO_ADDRESS) {
      return {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        poolAddress: pairAddressV3,
        fee: fee.toString(),
        type: "v3",
      };
    }
  }

  return {
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    poolAddress: process.env.ZERO_ADDRESS,
    fee: "",
    type: "",
  };
}

async function trading(pool) {
  console.log("pool", pool);
  if (pool.type === "v2") {
    try {
      const amountIn1 = new BigNumber(pool.amoutIn);
      const slippage = 100 - parseFloat(process.env.SLIPPAGE);
      console.log("slippage", slippage);
      const path = [pool.tokenIn, pool.tokenOut];
      const to = process.env.ADDRESS_RECEIVE;
      const amountOut = await routerContractV2.methods
        .getAmountsOut(amountIn1, path)
        .call();
      console.log("amountOut", amountOut);
      const amountMin = new BigNumber(amountOut[1])
        .multipliedBy(slippage)
        .dividedBy(100)
        .toFixed(0);
      console.log("amountMin", amountMin);
      const deadline = Math.floor(new Date().getTime() / 1000) + 30 * 60;
      console.log("amountMin", deadline);
      const swap = routerContractV2.methods.swapExactETHForTokens(
        web3.utils.toHex(amountOut[1]),
        path,
        to,
        web3.utils.toHex(deadline)
      );
      // console.log("encodeABI", swap);
      console.log(
        await sendTransaction(swap, pool.amoutIn, process.env.ROUTER_ADDRESS_V2)
      );
    } catch (error) {
      console.log("error", error);
    }
  }

  if (pool.type === "v3") {
    try {
      const amountIn = new BigNumber(pool.amoutIn).toString();
      const slippage = 100 - parseFloat(process.env.SLIPPAGE);
      console.log("slippage123123s", slippage);
      const path = [pool.tokenIn, pool.tokenOut];
      const to = process.env.ADDRESS_RECEIVE;
      console.log("address", to);
      const tokenIn = pool.tokenIn;
      const tokenOut = pool.tokenOut;
      const fee = pool.fee;
      const deadline = Math.floor(new Date().getTime() / 1000) + 30 * 60;
      const temp = "0x6456be06d125C0B7F661E6E09E695AF4d59D58D1";
      const quotedAmountOut =
        await quoterUniswapV3.callStatic.quoteExactInputSingle(
          tokenIn,
          tokenOut,
          fee,
          amountIn,
          0
        );

      const amountMin = new BigNumber(quotedAmountOut._hex)
        .multipliedBy(slippage)
        .dividedBy(100)
        .toFixed(0);
      console.log("amountMin", amountMin);
      const obj = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: fee,
        recipient: to,
        deadline,
        amountIn: amountIn,
        amountOutMinimum: amountMin,
        sqrtPriceLimitX96: 0,
      };
      const swap = routerContractV3.methods.exactInputSingle(obj);
      // console.log("encodeABI", swap);
      console.log(
        await sendTransaction(swap, pool.amoutIn, process.env.ROUTER_ADDRESS_V3)
      );
    } catch (error) {
      console.log("error", error);
    }
  }
  return null;
}
async function sendTransaction(data, amountIn, to) {
  console.log("amount In", to);
  const amountIn1 = new BigNumber(amountIn);
  const from = process.env.ADDRESS_FROM;
  const privateKey = process.env.PRIVATE_KEY;
  const count = await web3.eth.getTransactionCount(from);
  var txObject = {
    from: from,
    to: to,
    value: web3.utils.toHex(amountIn1),
    data: data.encodeABI(),
    nonce: web3.utils.toHex(count),
  };
  txObject.gasLimit = await web3.eth.estimateGas(txObject);
  txObject.gasPrice = web3.utils.toHex(await web3.eth.getGasPrice());

  const createTransaction = await web3.eth.accounts.signTransaction(
    txObject,
    privateKey
  );
  console.log("createReceipt12312", createTransaction);

  const createReceipt = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
  );
  console.log("createReceipt", createReceipt);
  return createReceipt;
}

module.exports = {
  getPair,
  trading,
};
