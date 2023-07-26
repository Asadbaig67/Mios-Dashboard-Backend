const { Router } = require("express");
const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const router = express.Router();
const Bank = require("../models/BankDetails");
const userRoleCheck = require("../middleware/userRoleCheck");


// Add bank details using : POST "/api/bankDetails/add", Requires a auth token
router.post("/add", fetchuser, async (req, res) => {
  try {
    const checkBankDetails = await Bank.findOne({ user: req.user.id });
    if (checkBankDetails) {
      return res.status(401).send({ message: "Bank Details already exists" });
    } else {
      const { bankName, accountHolderName, iban } = req.body;
      const bankDetails = new Bank({
        user: req.user.id,
        bankName,
        accountHolderName,
        iban
      });

      const savedBankDetails = await bankDetails.save();
      res.json(savedBankDetails);
    }
  } catch (error) {
    console.log(error);
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


// Get bank details using : GET "/api/bankDetails/", Requires a auth token
router.get("/", fetchuser, async (req, res) => {
  try {
    const bankDetails = await Bank.find({ user: req.user.id });
    res.json(bankDetails);
  } catch (error) {
    console.log(error);
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const bankDetails = await Bank.find({ user: req.params.id });
    res.json(bankDetails);
  } catch (error) {
    console.log(error);
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


// Update bank details using : PUT "/api/bankDetails/update", Requires a auth token
router.put("/update", fetchuser, async (req, res) => {
  try {
    const { bankName, accountHolderName, iban } = req.body;
    const newBankDetails = {};
    if (bankName) { newBankDetails.bankName = bankName };
    if (accountHolderName) { newBankDetails.accountHolderName = accountHolderName };
    if (iban) { newBankDetails.iban = iban };
    const bankDetails = await Bank.findOne({ user: req.user.id });
    if (!bankDetails) {
      return res.status(404).send("Not Found");
    }
    const updatedBankDetails = await Bank.findOneAndUpdate({ user: req.user.id }, { $set: newBankDetails }, { new: true });
    res.json(updatedBankDetails);
  } catch (error) {
    console.log(error);
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});









module.exports = router;