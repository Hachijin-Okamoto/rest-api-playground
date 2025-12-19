require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let users = [
  {
    user_id: "TaroYamada",
    password: "PaSSWd4TY",
    nickname: "たろー",
    comment: "僕は元気です",
  },
];

const findUserById = (id) => users.find((u) => u.user_id === id);

app.post("/signup", (req, res) => {
  const { user_id, password } = req.body;

  if (findUserById(user_id)) {
    return res.status(400).json({
      message: "Account creation failed",
      cause: "Already same user_id is used",
    });
  }

  if (!user_id || !password) {
    return res.status(400).json({
      message: "Account creation failed",
      cause: "Required user_id and password",
    });
  }

  const newUser = {
    user_id,
    password,
    nickname: user_id,
    comment: "",
  };

  users.push(newUser);

  res.status(200).json({
    message: "Account successfully created",
    user: { user_id: newUser.user_id, nickname: newUser.nickname },
  });
});

app.get("/users/:user_id", (req, res) => {
  const { user_id } = req.params;
  const user = findUserById(user_id);

  if (!user) {
    return res.status(404).json({ message: "No user found" });
  }

  res.status(200).json({
    message: "User details by user_id",
    user: {
      user_id: user.user_id,
      nickname: user.nickname,
      comment: user.comment,
    },
  });
});

app.get("/", (req, res) => {
  res.send("REST API Playground (Memory DB Mode)");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log("Memory DB initialized with TaroYamada");
});

module.exports = app;
