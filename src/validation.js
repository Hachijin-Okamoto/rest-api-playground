const { body, validationResult } = require("express-validator");

const User = require("./models/user");
const app = require("./index");

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

      const existingUser = await User.findOne({ where: { user_id } });
      if (existingUser) {
        return res.status(400).json({
          message: "Account creation failed",
          cause: "Already same user_id is used",
        });
      }

      const user = await User.create({
        user_id,
        password,
        nickname: user_id,
      });

      res.status(200).json({
        message: "Account successfully created",
        user: {
          user_id: user.user_id,
          nickname: user.nickname,
        },
      });
    } catch (e) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);
