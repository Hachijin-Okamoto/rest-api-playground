import { findUserById, createUser } from "./database.js";
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

app.get("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const authHeader = req.headers.authorization;

  console.log("--- New Request ---");
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [authUserId, authPassword] = credentials.split(":");

  const authUser = findUserById(authUserId);
  if (!authUser || authUser.password !== authPassword) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const targetUser = findUserById(user_id);
  if (!targetUser) {
    return res.status(404).json({ message: "No user found" });
  }

  const responseUser = {
    user_id: targetUser.user_id,
    nickname: targetUser.nickname || targetUser.user_id,
  };

  if (targetUser.comment) {
    responseUser.comment = targetUser.comment;
  }

  res.status(200).json({
    message: "User details by user_id",
    user: responseUser,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
