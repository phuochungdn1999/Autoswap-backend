const cron = require("node-cron");
const express = require("express");
const morgan = require("morgan");

var mongoose = require("mongoose");
require("dotenv").config();

app = express();
app.use(express.json());
app.use(morgan("dev"));

const tokens = require("./token/controller");
const service = require("./token/service");
const tokenService = require("./token/service/getPairAddress");
// Schedule tasks to be run on the server.
cron.schedule("* * * * *", async function () {
  const tokens = await service.getListToken();
  const pools = [];
  for (const token of tokens) {
    const obj = await tokenService.getPair(token.tokenIn, token.tokenOut);
    if (obj.poolAddress !== process.env.ZERO_ADDRESS) {
      pools.push({ ...obj, amoutIn: token.amountIn });
    }
  }
  console.log(pools);
  console.log("pollllll");
  for (const pool of pools) {
    const obj = await tokenService.trading(pool)
  }
});
app.use("/token", tokens);

var mongoDB = process.env.MONGO_URL;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(process.env.PORT, () => {
  console.log(`Listening on port 3000`);
});
