const router = require("express").Router();
const service = require("../service");

router.post("/", async (req, res) => {
  return await service.createNewPair(req, res);
}); //done
router.get("/", async (req, res) => {
  return res.send(await service.getListToken());
}); //done

module.exports = router;
