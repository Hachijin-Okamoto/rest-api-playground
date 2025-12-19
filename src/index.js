const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the REST API Playground!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
