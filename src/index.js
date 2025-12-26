import {
  findUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./database.js";
import express from "express";
import { body, validationResult } from "express-validator";
import { Buffer } from "buffer";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.post(
  "/signup",
  [
    body("user_id")
      .notEmpty()
      .withMessage("Required user_id and password")
      .isLength({ min: 6, max: 20 })
      .withMessage("Input length is incorrect")
      .isAlphanumeric()
      .withMessage("Incorrect character pattern"),
    body("password")
      .notEmpty()
      .withMessage("Required user_id and password")
      .isLength({ min: 8, max: 20 })
      .withMessage("Input length is incorrect")
      .isAscii()
      .withMessage("Incorrect character pattern"),
  ],
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

      const existingUser = findUserById(user_id);
      if (existingUser) {
        return res.status(400).json({
          message: "Account creation failed",
          cause: "Already same user_id is used",
        });
      }

      const user = { user_id, password };
      createUser(user);

      res.status(200).json({
        message: "Account successfully created",
        user: {
          user_id: user.user_id,
          nickname: user.nickname,
        },
      });
    } catch (_e) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

const getAuthenticatedUser = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [authUserId, authPassword] = credentials.split(":");

  const user = findUserById(authUserId);
  if (user && user.password === authPassword) {
    return user;
  }
  return null;
};

app.get("/users/:user_id", (req, res) => {
  const authUser = getAuthenticatedUser(req.headers.authorization);
  if (!authUser) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const targetUser = findUserById(req.params.user_id);
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
});

// eslint-disable-next-line no-control-regex
const noControlChars = /^[^\x00-\x1F\x7F]*$/;

app.patch(
  "/users/:user_id",
  [
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
      .withMessage(
        "String length limit exceeded or containing invalid characters",
      )
      .matches(noControlChars)
      .withMessage(
        "String length limit exceeded or containing invalid characters",
      ),

    body("comment")
      .optional({ checkFalsy: false })
      .isLength({ max: 100 })
      .withMessage(
        "String length limit exceeded or containing invalid characters",
      )
      .matches(noControlChars)
      .withMessage(
        "String length limit exceeded or containing invalid characters",
      ),

    body().custom((value, { req }) => {
      if (req.body.nickname === undefined && req.body.comment === undefined) {
        throw new Error("Required nickname or comment");
      }
      return true;
    }),

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
  ],
  async (req, res) => {
    const { user_id } = req.params;

    const authUser = getAuthenticatedUser(req.headers.authorization);
    if (!authUser) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (authUser.user_id !== user_id) {
      return res.status(403).json({ message: "No permission for update" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0];
      return res.status(400).json({
        message: "User updation failed",
        cause: error.msg,
      });
    }

    const targetUser = findUserById(user_id);
    if (!targetUser) {
      return res.status(404).json({ message: "No user found" });
    }

    const { nickname, comment } = req.body;
    const updatedData = {};

    if (nickname !== undefined) {
      updatedData.nickname = nickname === "" ? user_id : nickname;
    }
    if (comment !== undefined) {
      updatedData.comment = comment === "" ? "" : comment;
    }

    const updatedUser = updateUser(user_id, updatedData);

    res.status(200).json({
      message: "User successfully updated",
      user: {
        user_id: updatedUser.user_id,
        nickname: updatedUser.nickname,
        comment: updatedUser.comment,
      },
    });
  },
);

app.post("/close", (req, res) => {
  const authUser = getAuthenticatedUser(req.headers.authorization);

  if (!authUser) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }

  const isDeleted = deleteUser(authUser.user_id);

  if (isDeleted) {
    res.status(200).json({
      message: "Account and user successfully removed",
    });
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
