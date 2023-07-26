const { Router } = require('express')
const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const router = express.Router()
const Payment = require('../models/Payment')
const Order = require('../models/Orders')
const multer = require('multer');
const upload = multer({});
const v2 = require("../cloudinary");


// add payment using : POST "/api/payment/addpayment", Requires a auth token
router.post('/addpayment', fetchuser , async (req, res) => {
    try {
        const { orderId, shippingdetails, paymentAmount } = req.body
        if (req.errors) {
            return res.status(400).json({errors: req.errors})
        }
        const payment = new Payment({
            user: req.user.id,
            orderId,
            shippingdetails,
            paymentAmount,
        })
        const savedPayment = await payment.save()
        res.json(savedPayment)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)

// fetch all payments 
router.get('/allpayments', async (req, res) => {
    try {
        const payments = await Payment.find()
        const orderDetails = await Order.find()
        const orderMap = orderDetails.reduce((acc, order) => {
            acc[order._id] = order
            return acc
        }, {})
        payments.map(payment => {
            payment.orderId = orderMap[payment.orderId]
        })
        res.json(payments)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


// fetch all payments 
router.get('/paidpayments', async (req, res) => {
    try {
        const payments = await Payment.find()
        const orders = await Order.find()
        const orderMap = orders.reduce((acc, order) => {
            acc[order._id] = order
            return acc
        }, {})
        payments.map(payment => {
            payment.orderId = orderMap[payment.orderId]
        })
        const shippingDetails = await ShippingDetails.find()
        const shippingMap = shippingDetails.reduce((acc, shipping) => {
            acc[shipping._id] = shipping
            return acc
        }, {})
        payments.map(payment => {
            payment.shippingdetails = shippingMap[payment.shippingdetails]
        })
        
        // if orderId.paymentStatus === true then return payment
        const paidPayments =  payments.filter(payment => payment.orderId.payment === true)
        res.json(paidPayments)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


module.exports = router