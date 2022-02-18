const express = require("express");
const CreateError = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { v4 } = require("uuid");
const sendMail = require("../../helpers/sendMail");

const { User, schemas } = require("../../models/user");

const router = express.Router();

const { SECRET_KEY } = process.env;

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password, subscription } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new CreateError(409, "Email in use");
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const avatarURL = gravatar.url(email, false);
    const verificationToken = v4();
    await User.create({
      email,
      password: hashPassword,
      avatarURL,
      subscription,
      verificationToken,
    });
    const mail = {
      to: email,
      subject: "Подтвеждение email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/verify/${verificationToken}'>Нажмите чтобы подтвердить свой email</a>`,
    };
    await sendMail(mail);
    res.status(201).json({
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password, subscription } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new CreateError(401, "Email or password is wrong");
    }
    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new CreateError(401, "Email or password is wrong");
    }
    if (!user.verify) {
      throw new CreateError(401, "Email not verify");
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.json({
      token,
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
