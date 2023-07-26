const { Router } = require("express");
const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const router = express.Router();
const MyShop = require("../models/MyShop");

// Add Items to myshop using : POST "/api/myshop/addtomyshop", Requires a auth token
router.post("/addtomyshop", fetchuser, [], async (req, res) => {
  const user = req.user.id;
  const { product } = req.body;
  try {

    const existingData = await MyShop.findOne({ user });
    if (existingData) {

      let existingProduct = false;
      existingData.product.forEach((element) => {
        if (element.toString() === product.toString()) {
          existingProduct = true;
        }
      });
      if (existingProduct === false) {
        existingData.product.push(product);
        await existingData.save();
        res.json({ message: "Item added to myshop successfully" });
      } else {
        res.json({ message: "Item Already Present In Myshop" });
      }
    } else {

      // User doesn't exist, create new data
      const myShopData = new MyShop({
        user,
        product: product,
      });

      const savedData = await myShopData.save();
      res.status(200).json(savedData);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'An error occurred while processing data.' });
  }
});


// delete prodcut from myshop 
router.put("/deletemyshopitem/:id", fetchuser, async (req, res) => {
  try {

    const user = req.user.id;

    const existingData = await MyShop.findOne({ user });
    if (existingData) {
      let existingProduct = false;
      existingData.product.forEach((element) => {
        if (element._id.toString() === req.params.id.toString()) {
          existingProduct = true;
        }
      });
      if (existingProduct === true) {
        const index = existingData.product.indexOf(req.params.id);
        if (index > -1) {
          existingData.product.splice(index, 1);
        }
        await existingData.save();
        res.json({ message: "Item deleted from myshop successfully" });
      } else {
        res.json({ message: "Item Not Present In Myshop" });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});



// fetch all myshop items using : GET "/api/myshop/allmyshopitems", Requires a auth token
router.get("/allmyshopitems", fetchuser, [], async (req, res) => {
  try {
    const myshop = await MyShop.findOne({ user: req.user.id }).populate('product');
    res.json(myshop);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});




module.exports = router;