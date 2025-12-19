require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { sequelize } = require("./config/db");
const User = require("./models/User");

sequelize.authenticate().catch((err) => {
  console.error("Unable to connect to the database:", err);
});

sequelize.sync().then(async () => {
  console.log("Database connected!");

  const testUser = await User.findOne({ where: { user_id: "TaroYamada" } });

  if (!testUser) {
    await User.create({
      user_id: "TaroYamada",
      password: "PaSSWd4TY",
      nickname: "たろー",
      comment: "僕は元気です",
    });
    console.log('Test data "TaroYamada" created successfully.');
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the REST API Playground!");
});

app.post("/signup", async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const existingUser = await User.findOne({ where: { user_id } });
    if (existingUser) {
      return res.status(400).json({ message: "Already same user_id is used" });
    }

    const user = await User.create({
      user_id,
      password,
      nickname: user_id,
      comment: "",
    });

    res.status(200).json({
      message: "Account successfully created",
      user: { user_id: user.user_id, nickname: user.nickname },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/users", async (req, res) => {
  res.send("User list endpoint - to be implemented");
});

app.get("/users/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findOne({ where: { user_id } });

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
