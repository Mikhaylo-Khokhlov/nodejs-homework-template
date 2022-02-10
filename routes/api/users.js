const express = require("express");
const CreateError = require("http-errors");

const { User, schemas } = require("../../models/user");
const authenticate = require("../../middleware/authenticate");

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
      res.status(200).json('Subscription update was successful');
    } else {
      throw new CreateError(404, "Not found");
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
