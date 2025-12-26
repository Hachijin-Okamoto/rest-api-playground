"use strict";

import express from "express";
import * as controller from "./controller.js";

export const router = express.Router();

router.get("/", (_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

router.post("/signup", controller.createNewUser);

router.get("/users/:user_id", controller.getUserInfoById);

router.patch("/users/:user_id", controller.updateUser);

router.post("/close", controller.closeAccount);
