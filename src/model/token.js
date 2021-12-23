const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  tokenIn: {
    type: String,
    required: true,
  },
  tokenOut: {
    type: String,
    required: true,
  },
  pairAddress: {
    type: String,
  },
  amountIn: {
    type: String,
    required: true,
  },
  amountOut: {
    type: String,
  },
  type: {
    type: String,
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("Wallet", WalletSchema);

module.exports = User;
