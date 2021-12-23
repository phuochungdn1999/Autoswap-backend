const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("Wallet", WalletSchema);

module.exports = User;
