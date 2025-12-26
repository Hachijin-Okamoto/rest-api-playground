import { users, findUserById, createUser } from "./database.js";
import express from "express";
import { body, validationResult } from "express-validator";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.get("/users", async (_req, res) => {
  res.status(200).json({ users });
});

app.get("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const user = findUserById(user_id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
