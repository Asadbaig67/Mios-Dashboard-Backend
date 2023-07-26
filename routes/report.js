const { Router } = require('express')
const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const router = express.Router()
const Order = require('../models/Orders')
const Payment = require('../models/Payment')


//get order report using : GET "/api/report/orderreport", Requires a auth token
router.get('/orderreport', fetchuser , async (req, res) => {
    try {
        const orders = await Order.find({user: req.user.id})
        res.json(orders)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)

// order report search by date using : GET "/api/report/search/:date", Requires a auth token



//get payment report using : GET "/api/report/paymentreport", Requires a auth token
router.get('/paymentreport', fetchuser , async (req, res) => {
    try {
        const payments = await Payment.find({user: req.user.id})
        res.json(payments)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)

// get payments which are pending using : GET "/api/report/paymentreport/pending", Requires a auth token
router.get('/paymentreport/pending', fetchuser , async (req, res) => {
    try {
        const payments = await Payment.find({user: req.user.id, paymentStatus: 'Pending'})
        res.json(payments)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)

// customer detail report using : GET "/api/report/customerdetailreport", Requires a auth token
router.get('/customerdetailreport', fetchuser , async (req, res) => {
    try {
        const orders = await Order.find({user: req.user.id})
        const payments = await Payment.find({user: req.user.id})
        const customerDetail = {
            orders: orders.length,
            payments: payments.length,
            totalAmount: 0
        }
        for (let i = 0; i < payments.length; i++) {
            customerDetail.totalAmount += payments[i].paymentAmount
        }
        res.json(customerDetail)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)


// dropshiper profit report using : GET "/api/report/dropshipperprofitreport", Requires a auth token
router.get('/dropshipperprofitreport', fetchuser , async (req, res) => {
    try {
        const orders = await Order.find({user: req.user.id})
        const payments = await Payment.find({user: req.user.id})
        const dropshipperProfit = {
            orders: orders.length,
            payments: payments.length,
            totalAmount: 0
        }
        for (let i = 0; i < payments.length; i++) {
            dropshipperProfit.totalAmount += payments[i].paymentAmount
        }
        res.json(dropshipperProfit)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)


module.exports = router