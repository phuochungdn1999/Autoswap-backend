const Token = require("../../model/token");
const Web3 = require("web3");
const BigNumber = require("bignumber.js");
require("dotenv").config();

async function createNewPair(req, res) {
  console.log(req.body);
  const web3 = new Web3(process.env.RPC);
  if (web3.utils.isAddress(req.body.tokenIn) && req.body.tokenOut) {
    const token = new Token({
      tokenIn: req.body.tokenIn,
      tokenOut: req.body.tokenOut,
      amountIn: new BigNumber(req.body.amountIn)
        .multipliedBy(10 ** 18)
        .toNumber(),
    });
    console.log(token);
    try {
      await token.save();
      res.status(200).send(token);
    } catch (error) {
      res.status(400).send(error);
    }
  } else res.status(400).send({ error: "Invalid Address" });
}
async function getListToken() {
  const token = await Token.find({
    isFinished: false,
  });

  return token;
}

module.exports = {
  createNewPair,
  getListToken,
};
