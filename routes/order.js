const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const router = express.Router();
const Order = require("../models/Orders");
const ShippingDetails = require("../models/ShippingDetails");
const OrderDetails = require("../models/OrderDetails");
const multer = require("multer");
const Cart = require("../models/Cart");
const v2 = require("../cloudinary");
const Payment = require("../models/Payment");
const OrderTrackingDetails = require("../models/OrderTrackingDetails");

// fetch my orders
router.get("/myOrders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate({
      path: "user",
      select: ["name", "phone"],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/pendingOrders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      orderStatus: "Pending",
    }).populate({ path: "user", select: ["name", "phone"] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/DeliveredOrders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      orderStatus: "Delivered",
    }).populate({ path: "user", select: ["name", "phone"] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/ShippedOrders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      orderStatus: "Shipped",
    }).populate({ path: "user", select: ["name", "phone"] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/ReturnedOrders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      orderStatus: "Returned",
    }).populate({ path: "user", select: ["name", "phone"] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// fetch all orders
router.get("/allorders", async (req, res) => {
  try {
    const orders = await Order.find();
    // get shipping Details by shippingDetails in orders
    const shippingDetails = await ShippingDetails.find();
    const shippingMap = shippingDetails.reduce((acc, shipping) => {
      acc[shipping._id] = shipping;
      return acc;
    }, {});
    orders.map((order) => {
      order.shippingdetails = shippingMap[order.shippingdetails];
    });
    const orderDetails = await OrderDetails.find();
    const orderDetailsMap = orderDetails.reduce((acc, orderDetail) => {
      acc[orderDetail._id] = orderDetail;
      return acc;
    }, {});
    orders.map((order) => {
      order.orderDetails = orderDetailsMap[order.orderDetails];
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new order using : POST "/api/orders/addorder", Requires a auth token
router.post("/placeorder", fetchuser, async (req, res) => {
  try {
    const user = req.user._id;
    const {
      shippingDetails,
      billingDetails,
      products,
      paymentOption,
      photo,
      transactionId,
      total,
      shipping,
      orderType,
    } = req.body;
    if (paymentOption === "COD") {
      const order = new Order({
        user, shippingDetails, billingDetails, products, paymentOption, orderAmount: total, shippingPrice: shipping, orderType,
      });
      await order.save();
      await Cart.deleteOne({ user: user });
      res.status(201).send("Order placed Successfully.");
    } else if (paymentOption === "Receipt") {
      const { photo } = req.body;
      const pay = await Payment.findOne({ transactionId });
      if (pay?.transactionId) {
        return res.status(400).send("Transaction Id already present.");
      }
      const result = await v2.uploader.upload(photo, {
        folder: "mios-receipts",
        crop: "scale",
      });
      const { public_id, url } = result;
      if (!public_id) {
        return res.status(400).send("Server Error");
      } else {
        const order = await Order.create({
          user, shippingDetails, billingDetails, products, orderAmount: total, paymentOption, shippingPrice: shipping, orderType,
        });
        await Payment.create({ orderId: order._id, transactionId, photo: { public_id, url }, paymentAmount: total, });
        await Cart.deleteOne({ user: user });
        res.status(200).send("ORDER SUCCESSFUL");
      }
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(
        error.error?.message ? error.error.message : "Internal Server Error"
      );
  }
});

// add orderDetails using : POST "/api/orders/addorderdetails", Requires a auth token
router.post("/addorderdetails", async (req, res) => {
  try {
    const {
      name,
      wholesaleprice,
      discountedprice,
      dropshipprice,
      qty,
      subtotal,
      orderStatus,
    } = req.body;
    if (req.errors) {
      return res.status(400).json({ errors: req.errors });
    }

    const orderDetails = new OrderDetails({
      name,
      wholesaleprice,
      discountedprice,
      dropshipprice,
      qty,
      subtotal,
      orderStatus,
    });

    const savedOrderDetails = await orderDetails.save();
    res.json(savedOrderDetails);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// change payment status using : PUT "/api/orders/changepaymentstatus", Requires a auth token
router.put("/changepaymentstatus/:id", async (req, res) => {
  try {
    const order = await Order.findById({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: "No order found" });
    }
    if (order.payment === true) {
      order.payment = false;
    } else {
      order.payment = true;
    }
    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// change shipping status using : PUT "/api/orders/changeshippingstatus/:id", Requires a auth token
router.put("/changeshippingstatus/:id", async (req, res) => {
  try {
    const order = await Order.findById({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: "No order found" });
    }
    if (order.shippingStatus === true) {
      order.orderStatus = false;
      order.shippingStatus = false;
    } else {
      order.shippingStatus = true;
    }
    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// chnage order status using : PUT "/api/orders/changeorderstatus/:id", Requires a auth token
router.put("/changeorderstatus/:id", async (req, res) => {
  try {
    const { orderStatus } = req.body;
    if (!orderStatus) {
      return res.status(404).json({ message: "Enter a valid Order Status." });
    }
    const order = await Order.findById({ _id: req.params.id }).populate('user', 'role');
    if (!order) {
      return res.status(404).json({ message: "No order found" });
    }
    // if (order.orderStatus === "Pending") {
    order.orderStatus = orderStatus;
    let profitAmount = 0;
    if (order.user.role === "dropshipper") {
      if (orderStatus === "Returned") {
        profitAmount = -order.shippingPrice;
      } else if (orderStatus === "Delivered") {
        order.products.forEach((i) => {
          profitAmount += i.quantity * ((i.product.discountedPriceD ? i.product.discountedPriceD : i.product.dropshipperPrice) - (i.product.discountedPriceW ? i.product.discountedPriceW : i.product.wholesalePrice))
        })
        profitAmount -= order.shippingPrice;
      }
      order.profitAmount = profitAmount;
    }
    // }

    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// update order using : PUT "/api/orders/updateorder/:id", Requires a auth token
router.put("/updateorder/:id", fetchuser, async (req, res) => {
  try {
    const {
      shippingdetails,
      orderAmount,
      orderType,
      orderDetails,
      payment,
      shippingStatus,
      orderStatus,
    } = req.body;
    if (req.errors) {
      return res.status(400).json({ errors: req.errors });
    }

    const order = await Order.findById(req.params.id);
    order.shippingDetails = shippingdetails;
    order.orderAmount = orderAmount;
    order.orderType = orderType;
    order.orderDetails = orderDetails;
    order.payment = payment;
    order.shippingStatus = shippingStatus;
    order.orderStatus = orderStatus;
    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// fetch dropship order using : GET "/api/orders/dropshiporder", Requires a auth token
router.get("/dropshiporder", async (req, res) => {
  try {
    const orders = await Order.find({ orderType: "Dropship" });
    const shippingDetails = await ShippingDetails.find();
    const shippingMap = shippingDetails.reduce((acc, shipping) => {
      acc[shipping._id] = shipping;
      return acc;
    }, {});
    orders.map((order) => {
      order.shippingdetails = shippingMap[order.shippingdetails];
    });
    const orderDetails = await OrderDetails.find();
    const orderDetailsMap = orderDetails.reduce((acc, orderDetail) => {
      acc[orderDetail._id] = orderDetail;
      return acc;
    }, {});
    orders.map((order) => {
      order.orderDetails = orderDetailsMap[order.orderDetails];
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// fetch order by date using : GET "/api/orders/orderbydate/:ordrdate", Requires a auth token
router.get("/orderbydate/:orderdate", async (req, res) => {
  try {
    const orders = await Order.find({ orderDate: req.params.orderdate });
    const shippingDetails = await ShippingDetails.find();
    const shippingMap = shippingDetails.reduce((acc, shipping) => {
      acc[shipping._id] = shipping;
      return acc;
    }, {});
    orders.map((order) => {
      order.shippingdetails = shippingMap[order.shippingdetails];
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// fetch wholesale order using : GET "/api/orders/wholesale", Requires a auth token
router.get("/wholesaleorder", async (req, res) => {
  try {
    const orders = await Order.find({ orderType: "Wholesale" });
    const shippingDetails = await ShippingDetails.find();
    const shippingMap = shippingDetails.reduce((acc, shipping) => {
      acc[shipping._id] = shipping;
      return acc;
    }, {});
    orders.map((order) => {
      order.shippingdetails = shippingMap[order.shippingdetails];
    });
    const orderDetails = await OrderDetails.find();
    const orderDetailsMap = orderDetails.reduce((acc, orderDetail) => {
      acc[orderDetail._id] = orderDetail;
      return acc;
    }, {});
    orders.map((order) => {
      order.orderDetails = orderDetailsMap[order.orderDetails];
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/paymentbyOrderid/:id', async (req, res) => {
  const paymentDetails = await Payment.findOne({ orderId: req.params.id });
  if (!paymentDetails) {
    return res.status(400).json({ message: 'Not Found.' });
  }

  res.json(paymentDetails);
})

// add orderdetails using : POST "/api/orders/addorderdetails", Requires a auth token
router.post("/addorderdetails", fetchuser, async (req, res) => {
  try {
    const {
      name,
      wholesaleprice,
      discountedprice,
      dropshipprice,
      qty,
      subtotal,
      orderType,
    } = req.body;
    if (req.errors) {
      return res.status(400).json({ errors: req.errors });
    }

    const orderDetails = new OrderDetails({
      name,
      wholesaleprice,
      discountedprice,
      dropshipprice,
      qty,
      subtotal,
      orderType,
    });

    const savedOrderDetails = await orderDetails.save();
    res.json(savedOrderDetails);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/search/:date", async (req, res) => {
  try {
    const orders = await Order.find({
      date: {
        $gte: req.params.date + " 00:00:00",
        $lte: req.params.date + " 23:59:59",
      },
    });
    res.json(orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// delete order using : DELETE "/api/orders/deleteorder/:id", Requires a auth token
router.delete("/deleteorder/:id", fetchuser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    await order.remove();
    res.json({ msg: "Order removed" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//Get Order By id using "/api/order/orderproduct/:id"
router.get("/orderproduct/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//  adding details using : Post "/api/orders/addtrackingdetails/:id", Requires a auth token
router.post("/addtrackingdetails/:id", async (req, res) => {
  const { trackingId, courierServiceName } = req.body;
  const id = req.params.id;
  const order = await Order.findById({ _id: id });
  try {
    if (!order) {
      return res.status(404).json({ message: "No order found" });
    } else {
      const orderTrackingDetails = new OrderTrackingDetails({
        order: id,
        trackingId,
        courierServiceName,
      });
      const savedOrderTrackingDetails = await orderTrackingDetails.save();
      res.json(savedOrderTrackingDetails);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//Get Order By id for tracking details  using "/api/order/trackingid/:id"
router.get("/trackingid/:id", async (req, res) => {
  try {
    const trackingDetails = await OrderTrackingDetails.findOne({
      order: req.params.id,
    });
    if (!trackingDetails) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json(trackingDetails);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//  updating details using : Put "/api/orders/updatetrackingdetails/:id", Requires a auth token
router.put("/updatetrackingdetails/:id", async (req, res) => {
  const { trackingId, courierServiceName } = req.body;
  const tracking = await OrderTrackingDetails.findOne({ order: req.params.id });
  try {
    if (!tracking) {
      return res.status(404).json({ message: "No order found" });
    } else {
      tracking.trackingId = trackingId;
      tracking.courierServiceName = courierServiceName;
      const savedOrderTrackingDetails = await tracking.save();
      res.json(savedOrderTrackingDetails);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//  updating order Shipping Deatils : Put "/api/orders/updateshippingdetails/:id", Requires a auth token
router.put("/updateshippingdetails/:id", async (req, res) => {
  const { name, address, email, phone } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "shippingDetails.name": name,
          "shippingDetails.address": address,
          "shippingDetails.email": email,
          "shippingDetails.phone": phone,
        },
      },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "No order found" });
    }
    res.json(updatedOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Router for editing an order and sending products back to cart
router.put("/edituserorder/:orderId", fetchuser, async (req, res) => {
  try {

    const orderId = req.params.orderId;
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // if the user cart is not empty, then update product stock and delete the cart
    const findUserCart = await Cart.findOne({ user: req.user.id });
    if (findUserCart) {
      const cartItems = findUserCart.cart;
      for (const cartItem of cartItems) {
        const productId = cartItem.product._id;
        const quantity = cartItem.quantity

        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        const newStock = product.stock + quantity;
        await Product.findByIdAndUpdate(productId, { stock: newStock });
      }

      // Delete the user's cart
      await Cart.deleteOne({ user: req.user.id });
    }

    // Send back the order items in the cart
    const userCart = new Cart({
      user: req.user.id,
      cart: order.products,
    });
    const savedCart = await userCart.save();

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ message: 'Order updated successfully', cart: savedCart });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// router for verifying order payment
router.put("/verifyorderpayment/:id", fetchuser, async (req, res) => {

  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  } else {
    if (order.paymentStatus === false) {
      order.paymentStatus = true;
      const savedOrder = await order.save();
      res.json(savedOrder);
    } else {
      order.paymentStatus = false;
      const savedOrder = await order.save();
      res.json(savedOrder);
    }
  }
});

// order reverse route for admin to reverse an order
router.put("/reverseorder/:id", fetchuser, async (req, res) => {
  const { id } = req.params;
  const findOrder = Order.findById(id);
  if (!findOrder) {
    return res.status(404).json({ message: "Order not found" });
  }
  await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        orderStatus: "Pending",
        shippingStatus: "false",
      },
    },
    { new: true }
  );
  const findTrackng = await OrderTrackingDetails.findOne({ order: id });
  if (!findTrackng) {
    return res.status(404).json({ message: "Order not found" });
  }
  await findTrackng.remove();
  res.json("Order Reversed");

});

// delete order using : DELETE "/api/order/deleteorderadmin/:id", Requires a auth token
router.delete("/deleteorderadmin/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    await order.remove();
    res.json({ msg: "Order removed" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
