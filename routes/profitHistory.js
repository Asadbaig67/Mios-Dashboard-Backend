const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const Orders = require('../models/Orders');
const userRoleCheck = require('../middleware/userRoleCheck');
const User = require('../models/User');
const PaidProfit = require('../models/ProfitPaidHistory');
const router = express.Router();
const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');

// profit per order per user
router.get('/pendingprofitsbyuser/:id', fetchuser, userRoleCheck, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (user.role !== 'dropshipper') {
            return res.status(403).json({
                message: 'Access denied. User is not a dropshipper.'
            });
        }

        const orders = await Orders.find({ user, profitAmount: { $gt: 0 } })
            .populate('user', 'name company city')
            .select('profitAmount profitStatus id').
            sort({ profitStatus: 1 })
            .exec();

        if (!orders) {
            return res.status(404).json({
                message: 'No orders found for this user with unpaid profit.'
            });
        }
        res.send(orders);
    } catch (error) {
        res.status(400).send(error)
    }
})


//complete profits of all users
router.get('/allprofits', fetchuser, userRoleCheck, async (req, res) => {
    try {
        // const orders = await Orders.findOne({ user: req.body.userId });
        const result = await Orders.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $match: {
                    'user.role': 'dropshipper',
                    'profitStatus': "Not Paid",
                }
            },
            {
                $group: {
                    _id: '$user._id',
                    name: { $first: '$user.name' },
                    company: { $first: '$user.company' },
                    city: { $first: '$user.city' },
                    totalProfit: { $sum: '$profitAmount' }
                }
            },
            {
                $match: {
                    totalProfit: { $ne: 0 }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    name: 1,
                    company: 1,
                    city: 1,
                    totalProfit: 1
                }
            },
        ]);

        res.send(result);

    } catch (error) {
        res.send(error);
    }
})


//pay profit
router.post('/payAllprofits', fetchuser, userRoleCheck, async (req, res) => {
    try {
        // Update all orders with specified dropshipperId and profitstatus
        const orderIds = await Orders.find({ user: req.body.userId, profitStatus: 'Not Paid' }).select('orderId')


        // Find PaidProfitHistory document for specified dropshipperId
        if (orderIds.length <= 0) {
            return res.status(404).json({ message: 'No Pending Profits Found.' });
        }


        await Orders.updateMany({ _id: { $in: orderIds }, user: req.body.userId, profitStatus: 'Not Paid' }, { profitStatus: 'Paid' });
        const paidProfitHistory = await PaidProfit.findOne({ user: req.body.userId });
        if (paidProfitHistory) {
            // If document exists, push the new record into the records array
            paidProfitHistory.records.push({
                orders: orderIds,
                amount: req.body.amount
            });
            await paidProfitHistory.save();
        } else {
            // If document does not exist, create a new document with the record
            await PaidProfit.create({
                user: req.body.userId,
                records: [{
                    orders: orderIds,
                    amount: req.body.amount
                }]
            });
        }
        res.json({ message: 'Successfully Paid the profit' });
    } catch (error) {
        res.status(400).send(error)
    }
})



router.post('/paySingleprofit', fetchuser, userRoleCheck, async (req, res) => {
    try {
        const orderIds = new Array();
        // Update all orders with specified dropshipperId and profitstatus
        await orderIds.push(await Orders.findOne({ _id: req.body.orderId, profitStatus: 'Not Paid' }));
        if (orderIds.length <= 0) {
            return res.status(404).json({ message: 'No Pending Profits Found.' });
        }
        await Orders.updateOne({ _id: req.body.orderId, }, { profitStatus: 'Paid' })
        // Find PaidProfitHistory document for specified dropshipperId
        const paidProfitHistory = await PaidProfit.findOne({ user: req.body.userId });

        if (paidProfitHistory) {
            // If document exists, push the new record into the records array
            paidProfitHistory.records.push({
                orders: orderIds,
                amount: req.body.amount
            });
            await paidProfitHistory.save();
        } else {
            // If document does not exist, create a new document with the record
            await PaidProfit.create({
                user: req.body.userId,
                records: [{
                    orders: orderIds,
                    amount: req.body.amount
                }]
            });
        }

        res.json({ message: 'Successfully Paid the profit' });
    } catch (error) {
        res.send(error)
    }
})




router.get('/paidprofits', fetchuser, userRoleCheck, async (req, res) => {
    try {

        const result = await PaidProfit.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: '$user._id',
                    name: { $first: '$user.name' },
                    city: { $first: '$user.city' },
                    totalProfit: { $sum: { $sum: "$records.amount" } },
                    latestDatePaid: { $max: { $max: '$records.datePaid' } }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    name: 1,
                    city: 1,
                    totalProfit: 1,
                    latestDatePaid: 1
                }
            }
        ]);
        res.send(result);

    } catch (error) {
        res.send(error);
    }
})



router.get('/paidperuser/:id', fetchuser, userRoleCheck, async (req, res) => {
    try {
        const result = await PaidProfit.findOne({ user: req.params.id }).populate('user', 'name');
        res.send(result);

    } catch (error) {
        console.log(error)
        res.send(error);
    }
})


router.get('/singleprofit/:userid/:id', fetchuser, userRoleCheck, async (req, res) => {
    try {
        const user = await User.findById({ _id: req.params.userid });
        const records = await PaidProfit.findOne(
            { user: req.params.userid, records: { $elemMatch: { _id: req.params.id } } },
            { 'records.$': 1 }).populate('records.orders').exec();

        res.json({ records, user });
    } catch (error) {
        console.log(error)
        res.send(error);
    }
})


router.get('/mypendingProfits', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (user.role !== 'dropshipper') {
            return res.status(403).json({
                message: 'Access denied. User is not a dropshipper.'
            });
        }

        const orders = await Orders.find({ user, profitStatus: 'Not Paid', profitAmount: { $gt: 0 }, })
            .populate('user', 'name company city')
            .select('profitAmount profitStatus').
            sort({ profitStatus: 1 })
            .exec();

        if (!orders) {
            return res.status(404).json({
                message: 'No orders found for this user with unpaid profit.'
            });
        }
        res.send(orders);
    } catch (error) {
        res.status(400).send(error)
    }
})


router.get('/Mypaidprofit', fetchuser, async (req, res) => {
    try {
        const result = await PaidProfit.findOne({ user: req.user.id }).populate('user', 'name');
        res.send(result);

    } catch (error) {
        console.log(error)
        res.send(error);
    }
})


router.get('/mysingleprofit/:id', fetchuser, async (req, res) => {
    try {
        const user = await User.findById({ _id: req.user.id });
        const records = await PaidProfit.findOne(
            { user: req.user.id, records: { $elemMatch: { _id: req.params.id } } },
            { 'records.$': 1 }).populate('records.orders').exec();

        res.json({ records, user });
    } catch (error) {
        console.log(error)
        res.send(error);
    }
})




module.exports = router;
