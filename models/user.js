const {Schema, model} = require("mongoose");
const Joi = require("joi");

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = Schema({
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter"
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL:{
      type: String,
    }
  }, {versionKey: false, timestamps: true});

const registerJoiSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().min(6).required(),
    subscription: Joi.string()
})
const updateSubscriptionJoiSchema = Joi.object({
    _id: Joi.string(),
    subscription: Joi.string().valid('starter', 'pro', 'business')
})

const User = model("user", userSchema);

const schemas = {
    register: registerJoiSchema,
    updateSubscription: updateSubscriptionJoiSchema,
};

module.exports = {
    User,
    schemas
}