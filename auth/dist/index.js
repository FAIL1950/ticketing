// src/index.ts
import mongoose2 from "mongoose";

// src/app.ts
import express5 from "express";
import cookieSession from "cookie-session";

// src/routes/current-user.ts
import express from "express";

// ../common/src/middlewares/current-user.ts
import jwt from "jsonwebtoken";
var currentUser = (req, res, next) => {
  if (!req.session?.jwt) {
    return next();
  }
  try {
    const payload = jwt.verify(req.session.jwt, process.env.JWT_KEY);
    req.currentUser = payload;
  } catch (err) {
  }
  next();
};

// ../common/src/errors/custom-error.ts
var CustomError = class _CustomError extends Error {
  constructor(message) {
    super(message);
    if (this.constructor === _CustomError) {
      throw new Error("Cannot instantiate abstract class");
    }
  }
};

// src/routes/current-user.ts
var router = express.Router();
router.get("/api/users/currentuser", currentUser, (req, res) => {
  res.send({ currentUser: req.currentUser || null });
});

// src/routes/signin.ts
import express2 from "express";
import { body } from "express-validator";
import jwt2 from "jsonwebtoken";

// src/services/password.ts
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
var Password = class {
  static async toHash(password) {
    const salt = randomBytes(8).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
  }
  static async compare(storedPassword, suppliedPassword) {
    const [hashedPassword, salt] = storedPassword.split(".");
    if (!salt) throw new Error("Invalid stored password format");
    const buf = await scryptAsync(suppliedPassword, salt, 64);
    return buf.toString("hex") === hashedPassword;
  }
};

// src/models/user.ts
import mongoose from "mongoose";

// src/utils/toJSON.ts
function toJSON(schema, ...fields) {
  schema.set("toJSON", {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
      delete returnedObject.createdAt;
      delete returnedObject.updatedAt;
      fields.forEach((field) => delete returnedObject[field]);
    }
  });
}

// src/models/user.ts
var userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true }
  },
  {
    timestamps: true
  }
);
toJSON(userSchema, "password");
userSchema.pre("save", async function() {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
});
userSchema.statics.build = function(attrs) {
  return new this(attrs);
};
var User = mongoose.model("User", userSchema);

// ../common/src/middlewares/validate-request.ts
import { validationResult } from "express-validator";

// ../common/src/errors/request-validation-error.ts
var RequestValidationError = class extends CustomError {
  constructor(errors) {
    super("Invalid request body");
    this.errors = errors;
  }
  statusCode = 400;
  serializeErrors() {
    return this.errors.map((err) => {
      if (err.type === "field") {
        return { message: err.msg, field: err.path };
      }
      return { message: err.msg };
    });
  }
};

// ../common/src/middlewares/validate-request.ts
var validationRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new RequestValidationError(errors.array());
  }
  next();
};

// ../common/src/errors/bad-request-error.ts
var BadRequestError = class extends CustomError {
  constructor(message) {
    super(message);
    this.message = message;
  }
  statusCode = 400;
  serializeErrors() {
    return [{ message: this.message }];
  }
};

// src/routes/signin.ts
var router2 = express2.Router();
router2.post(
  "/api/users/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").trim().notEmpty().withMessage("You must supply a password"),
    validationRequest
  ],
  async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }
    const passwordsMatch = await Password.compare(existingUser.password, password);
    if (!passwordsMatch) {
      throw new BadRequestError("Invalid credentials");
    }
    const userJwt = jwt2.sign({
      id: existingUser.id,
      email: existingUser.email
    }, process.env.JWT_KEY);
    req.session = {
      jwt: userJwt
    };
    res.status(200).send(existingUser);
  }
);

// src/routes/signout.ts
import express3 from "express";
var router3 = express3.Router();
router3.post("/api/users/signout", (req, res) => {
  req.session = null;
  res.send({});
});

// src/routes/signup.ts
import express4 from "express";
import { body as body2 } from "express-validator";
import jwt3 from "jsonwebtoken";
var router4 = express4.Router();
router4.post("/api/users/signup", [
  body2("email").isEmail().withMessage("Email must be valid"),
  body2("password").trim().isLength({ min: 4, max: 20 }).withMessage("Passwords must be between 4 and 20 characters"),
  validationRequest
], async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError("Email in use");
  }
  const user = User.build({ email, password });
  await user.save();
  const userJwt = jwt3.sign({
    id: user.id,
    email: user.email
  }, process.env.JWT_KEY);
  req.session = {
    jwt: userJwt
  };
  res.status(201).send(user);
});

// ../common/src/middlewares/error-handler.ts
var errorHandler = (err, req, res, next) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }
  res.status(400).send({ errors: [{ message: "Something went wrong" }] });
};

// ../common/src/errors/not-found-error.ts
var NotFoundError = class extends CustomError {
  statusCode = 404;
  constructor() {
    super("Route not found");
  }
  serializeErrors() {
    return [{ message: "Not Found" }];
  }
};

// src/app.ts
var app = express5();
app.set("trust proxy", true);
app.use(express5.json());
app.use(cookieSession({
  signed: false,
  secure: process.env.NODE_ENV !== "test"
}));
app.use(router);
app.use(router2);
app.use(router3);
app.use(router4);
app.use(async (req, res) => {
  throw new NotFoundError();
});
app.use(errorHandler);

// src/index.ts
if (!process.env.JWT_KEY) {
  throw new Error("JWT_KEY must be defined");
}
try {
  await mongoose2.connect("mongodb://auth-mongo-srv:27017/auth");
  console.log("Connected to MongoDB");
  app.listen(3e3, () => {
    console.log("Server running on port 3000");
  });
} catch (err) {
  console.error("Start error:", err);
}
