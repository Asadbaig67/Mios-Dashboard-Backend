const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
const userRoleCheck = require("../middleware/userRoleCheck");
const JWT_SECRET = "secret170117862202";




router.post(
  "/signup",
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ errors: { msg: "User already exists" } });
      }
      const { email, password, role, name, address, city, phone, company } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ email, password: hashedPassword, city, role, name, address, phone, company });

      const data = {
        user: {
          id: user._id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "10d" });
      res.cookie("token", authtoken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.json({ authtoken });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);




router.get("/logout", async (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: "none" }).json({
    success: true,
    message: "Logged out successfully",
  });
  
});




router.put("/update/:id", fetchuser, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
}
);




router.post(
  "/forget-password",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: { msg: "User does not exist" } });
      }
      user = await User.findOneAndUpdate({ email: req.body.email }, {
        $set: {
          resetPasswordToken: req.body.resetPasswordToken,
          resetPasswordExpires: req.body.resetPasswordExpires,
        },
      });

      const data = {
        user: {
          id: user._id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "10d" });
      res.cookie("token", authtoken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.json({ authtoken });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);




router.post(
  "/adminlogin",
  async (req, res) => {
    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: { msg: "Invalid Credentails." } });
      }
      if (user.isAdmin !== true) {
        return res
          .status(400)
          .json({ errors: { msg: "Invalid Credentails." } });
      }
      const isMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: { msg: "Invalid Credentials." } });
      }
      const data = {
        user: {
          id: user._id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "10d" });
      res.cookie("token", authtoken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.json({ authtoken });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);





router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email: email, isAdmin: false });
      if (!user) {
        return res
          .status(400)
          .json({ errors: { msg: "Invalid Credentials" } });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: { msg: "Invalid Credentials" } });
      }
      const data = {
        user: {
          id: user._id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "10d" });
      res.cookie("token", authtoken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.json({ authtoken });

    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);




router.get("/user", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "User does not exist" }] });
    }
    res.json(user);

  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});





router.get('/getCustomerDetails/:id', fetchuser, userRoleCheck, async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id, isAdmin: false }).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message)
    res.status(500).send(err.message)
  }
}
)



router.get('/allusers', fetchuser, userRoleCheck, async (req, res, next) => {
  try {
    const user = await User.find({ isAdmin: false }).select("-password");
    res.json(user)
  } catch (error) {
    console.error(error.message)
    res.status(500).send(err.message)
  }
}
)





router.get("/allwholesellers", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const user = await User.find({ role: "wholeseller", isAdmin: "false" }).select("-password");
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "No Wholeseller Found." }] });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});





router.get("/alldropshippers", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const user = await User.find({ role: "dropshipper", dropShipperStatus: true, isAdmin: false }).select("-password");
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "No DropShipper Found." }] });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});




router.get("/allrequests", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const user = await User.find({ role: "dropshipper", dropShipperStatus: false, isAdmin: false }).select("-password");
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "No DropShipper Request Found." }] });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});





router.put("/approve/:id", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const _id = req.params.id;
    const ApprovedUser = await User.findByIdAndUpdate({ _id }, { dropShipperStatus: false }).select("-password");
    if (!ApprovedUser) {
      return res.status(400).json({ errors: [{ msg: "User does not exist" }] });
    }
    ApprovedUser.dropShipperStatus = true;
    await ApprovedUser.save();
    res.json({ msg: "User approved" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});





router.delete("/delete/:id", fetchuser, userRoleCheck, async (req, res) => {
  try {
    const DeletedUser = await User.findOneAndDelete({ _id: req.params.id });
    if (!DeletedUser) {
      return res.status(400).json({ errors: [{ msg: "User does not exist" }] });
    }
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});





router.post(
  "/createWholeSeller", fetchuser, userRoleCheck,
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ errors: { msg: "User already exists" } });
      }
      const { email, password, name, city, address, phone, company } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ email, password: hashedPassword, role: 'wholeseller', city, name, address, phone, company });
      res.json({ msg: 'Wholeseller User created.' });

    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);





router.post(
  "/createDropshipper", fetchuser, userRoleCheck,
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ errors: { msg: "User already exists" } });
      }
      const { email, password, name, address, phone, company, city } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ email, password: hashedPassword, role: 'dropshipper', name, city, address, phone, company, dropShipperStatus: true });
      res.json({ msg: 'Dropshipper User created.' });

    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);




router.post(
  "/createRequest", fetchuser, userRoleCheck,
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ errors: { msg: "User already exists" } });
      }
      const { email, password, name, address, phone, company, city } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ email, password: hashedPassword, role: 'dropshipper', name, address, phone, company, city });
      res.json({ msg: 'Dropshipper request created.' });

    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);


router.put(
  "/admin/editCustomer/:id", fetchuser, userRoleCheck,
  [
    body("name").not().isEmpty().withMessage("Name is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const id = req.params.id;

      const { name, address, phone, company, role, dropShipperStatus, city } = req.body;
      await User.findByIdAndUpdate({ _id: id }, { role, name, address, phone, company, dropShipperStatus, city });
      res.json({ msg: 'Dropshipper request created.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);



module.exports = router;