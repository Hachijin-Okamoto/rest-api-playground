"use strict";

import { body, validationResult } from "express-validator";
import * as service from "./service.js";
import { Buffer } from "buffer";

/**
 * 認証を行う関数
 * @param {req.header} authHeader
 * @returns 認証を通ったユーザ情報、認証失敗ならnull
 */
const getAuthenticatedUser = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [authUserId, authPassword] = credentials.split(":");

  const user = await service.getUserById(authUserId);
  if (user && user.password === authPassword) {
    return user;
  }
  return null;
};

/**
 * 新規ユーザの登録(POST /signup)
 */
export const createNewUser = [
  body("user_id")
    .notEmpty() // 必須
    .withMessage("Required user_id and password")
    .isLength({ min: 6, max: 20 }) // 6文字以上20文字以内
    .withMessage("Input length is incorrect")
    .isAlphanumeric() //半角英数字
    .withMessage("Incorrect character pattern"),
  body("password")
    .notEmpty() // 必須
    .withMessage("Required user_id and password")
    .isLength({ min: 8, max: 20 }) // 8文字以上20文字以内
    .withMessage("Input length is incorrect")
    .matches(/^[!-~]+$/) // 半角英数字記号（空白と制御コードを除くASCII文字）
    .withMessage("Incorrect character pattern"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Account creation failed",
        cause: errors.array()[0].msg,
      });
    }

    try {
      const { user_id, password } = req.body;
      const result = await service.registerUser(user_id, password);

      if (result.error) {
        return res.status(400).json({
          message: "Account creation failed",
          cause: result.cause,
        });
      }

      res.status(200).json({
        message: "Account successfully created",
        user: result.user,
      });
    } catch (_error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];

/**
 * ユーザ情報の取得(GET /users/:user_id)
 */
export const getUserInfoById = async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req.headers.authorization);
    if (!authUser) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const targetUser = await service.getUserById(req.params.user_id);
    if (!targetUser) {
      return res.status(404).json({ message: "No user found" });
    }

    const result = {
      user_id: targetUser.user_id,
      nickname: targetUser.nickname || targetUser.user_id,
    };
    if (targetUser.comment) result.comment = targetUser.comment;

    res.status(200).json({
      message: "User details by user_id",
      user: result,
    });
  } catch (_error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// eslint-disable-next-line no-control-regex
const noControlChars = /^[^\x00-\x1F\x7F]*$/;

/**
 * ユーザ情報の更新(PATCH /users/:user_id)
 */
export const updateUser = [
  body().custom((_value, { req }) => {
    if (
      !req.body ||
      (req.body.nickname === undefined && req.body.comment === undefined)
    ) {
      throw new Error("Required nickname or comment");
    }
    return true;
  }),
  body("nickname")
    .optional({ checkFalsy: false })
    .isLength({ max: 30 })
    .matches(noControlChars)
    .withMessage(
      "String length limit exceeded or containing invalid characters",
    ),
  body("comment")
    .optional({ checkFalsy: false })
    .isLength({ max: 100 })
    .matches(noControlChars)
    .withMessage(
      "String length limit exceeded or containing invalid characters",
    ),
  body("user_id").custom((value) => {
    if (value !== undefined)
      throw new Error("Not updatable user_id and password");
    return true;
  }),
  body("password").custom((value) => {
    if (value !== undefined)
      throw new Error("Not updatable user_id and password");
    return true;
  }),

  async (req, res) => {
    const { user_id } = req.params;

    const authUser = await getAuthenticatedUser(req.headers.authorization);
    if (!authUser) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    if (authUser.user_id !== user_id) {
      return res.status(403).json({ message: "No permission for update" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "User updation failed",
        cause: errors.array()[0].msg,
      });
    }

    try {
      const result = await service.editUser(user_id, req.body);

      if (result.error) {
        return res.status(404).json({ message: result.message });
      }

      res.status(200).json({
        message: "User successfully updated",
        user: result.user,
      });
    } catch (_error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];

/**
 * ユーザの削除(POST /close)
 */
export const closeAccount = async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req.headers.authorization);
    if (!authUser) {
      return res.status(401).json({
        message: "Authentication failed",
      });
    }

    const isDeleted = await service.removeUser(authUser.user_id);

    if (isDeleted) {
      return res.status(200).json({
        message: "Account and user successfully removed",
      });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (_error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
