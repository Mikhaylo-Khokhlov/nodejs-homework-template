const express = require("express");
const CreateError = require("http-errors");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
// eslint-disable-next-line no-unused-vars
const Joi = require("joi");
const sendMail = require("../../helpers/sendMail");

const { User, schemas } = require("../../models/user");
const authenticate = require("../../middleware/authenticate");
const upload = require("../../middleware/upload");
const { BASE_URL } = process.env;

const router = express.Router();

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findById(_id);
  if (!user || !user.token) {
    throw new CreateError(401, "Not authorized");
  }

  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).send();
});

router.patch("/", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.updateSubscription.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }

    const { subscription, _id } = req.body;

    const resUpdateUserSubscription = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true }
    );
    if (resUpdateUserSubscription) {
      res.status(200).json("Subscription update was successful");
    } else {
      throw new CreateError(404, "Not found");
    }
  } catch (e) {
    next(e);
  }
});

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    const { _id } = req.user;
    if (!req.file) {
      throw new CreateError(400, "Please upload file");
    }
    const { path: tempUpload, filename } = req.file;
    const item = await Jimp.read(tempUpload);
    item.resize(250, 250).write(tempUpload);
    try {
      const [extention] = filename.split(".").reverse();
      const newFileName = `${_id}.${extention}`;
      const resultUpload = path.join(avatarsDir, newFileName);
      await fs.rename(tempUpload, resultUpload);
      const avatarURL = path.join(`${BASE_URL}/public/avatars`, newFileName);
      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({
        avatarURL,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw CreateError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
    res.status(200).json("Verification successful");
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { error } = schemas.verifyEmail.validate(req.body);
    if (error) {
      throw CreateError(400, "missing required field email");
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      throw CreateError(400, "Verification has already been passed");
    }
    const mail = {
      to: email,
      subject: "Подтвеждение email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/verify/${user.verificationToken}'>Нажмите чтобы подтвердить свой email</a>`,
    };
    await sendMail(mail);
    res.status(200).json("Verification email sent");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
