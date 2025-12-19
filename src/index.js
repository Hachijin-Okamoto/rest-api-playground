import { users, findUserById } from "../database.js";
import express from "express";

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

app.post("/users", async (req, res) => {
  const { user_id, password, nickname, comment } = req.body;

  if (!user_id || !password || !nickname) {
    return res
      .status(400)
      .json({ message: "user_id, password, and nickname are required" });
  }

  const existingUser = findUserById(user_id);
  if (existingUser) {
    return res.status(400).json({ message: "User ID already exists" });
  }

  const newUser = { user_id, password, nickname, comment: comment || "" };
  users.push(newUser);

  res.status(201).json({ message: "User created successfully", user: newUser });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
