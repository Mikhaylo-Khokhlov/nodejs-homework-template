const express = require("express");
const CreateError = require("http-errors");

const { Contact, schemasJoi } = require("../../models/contacts");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await Contact.find({});
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/:contactId", async (req, res, next) => {
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

router.post("/", async (req, res, next) => {
  try {
    const { error } = schemasJoi.add.validate(req.body);
    if (error) {
      throw new CreateError(400, "missing required name field");
    }
    const resAddNewContact = await Contact.create(req.body);
    res.status(201).json(resAddNewContact);
  } catch (e) {
    next(e);
  }
});

router.delete("/:contactId", async (req, res, next) => {
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

router.put("/:contactId", async (req, res, next) => {
  try {
    const { error } = schemasJoi.update.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }

    const { contactId } = req.params;
    const body = req.body;
    if (Object.keys(body).length === 0) {
      throw new CreateError(400, "missing fields");
    }

    const resUpdateContact = await Contact.findByIdAndUpdate(contactId, body, {
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

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { error } = schemasJoi.updateFavofite.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }

    const { contactId } = req.params;
    const body = req.body;
    if (Object.keys(body).length === 0) {
      throw new CreateError(400, "missing field favorite");
    }

    const resUpdateContactFavorite = await Contact.findByIdAndUpdate(
      contactId,
      body,
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
