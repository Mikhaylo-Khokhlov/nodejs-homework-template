const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendMail = async (data) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const mail = { ...data, from: "mihailhohlov257@gmail.com" };
    await sgMail.send(mail);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = sendMail;
