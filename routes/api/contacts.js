const express = require("express");
const CreateError = require("http-errors");

const { Contact, schemasJoi } = require("../../models/contacts");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite = true } = req.query;
    const { _id } = req.user;
    if (!Number.isNaN(page) && !Number.isNaN(limit)) {
      const skip = (page - 1) * limit;
      const result = await Contact.find(
        { owner: _id, favorite },
        "-createdAt -updatedAt",
        { skip, limit: +limit }
      ).populate("owner", "email");
      res.json(result);
    }
  } catch (e) {
    next(e);
  }
});

router.get("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const resContactById = await Contact.findById(contactId);

    if (!resContactById) {
      throw new CreateError(404, "Not found");
    }
    res.json(resContactById);
  } catch (e) {
    next(e);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { error } = schemasJoi.add.validate(req.body);
    if (error) {
      throw new CreateError(400, "missing required name field");
    }

    const data = { ...req.body, owner: req.user._id };
    const resAddNewContact = await Contact.create(data);
    res.status(201).json(resAddNewContact);
  } catch (e) {
    next(e);
  }
});

router.delete("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const resDelNewContact = await Contact.findByIdAndDelete(contactId);
    if (!resDelNewContact) {
      throw new CreateError(404, "Not found");
    }
    res.json({ message: "contact deleted" });
  } catch (e) {
    next(e);
  }
});

router.put("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { error } = schemasJoi.update.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }

    const { contactId } = req.params;
    const data = { ...req.body, owner: req.user._id };
    if (Object.keys(data).length === 0) {
      throw new CreateError(400, "missing fields");
    }

    const resUpdateContact = await Contact.findByIdAndUpdate(contactId, data, {
      new: true,
    });
    if (resUpdateContact) {
      res.status(200).json(resUpdateContact);
    } else {
      throw new CreateError(404, "Not found");
    }
  } catch (e) {
    next(e);
  }
});

router.patch("/:contactId/favorite", authenticate, async (req, res, next) => {
  try {
    const { error } = schemasJoi.updateFavofite.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const data = { ...req.body, owner: req.user._id };
    const { contactId } = req.params;
    if (Object.keys(data).length === 0) {
      throw new CreateError(400, "missing field favorite");
    }

    const resUpdateContactFavorite = await Contact.findByIdAndUpdate(
      contactId,
      data,
      {
        new: true,
      }
    );
    if (resUpdateContactFavorite) {
      res.status(200).json(resUpdateContactFavorite);
    } else {
      throw new CreateError(404, "Not found");
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
