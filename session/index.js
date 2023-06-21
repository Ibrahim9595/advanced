const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { createHash } = require("crypto");
dotenv.config();

const app = express();
app.use(express.json());

const users = [
  {
    id: 1,
    email: "test1@test.com",
    password: "12345",
    roles: ["products.read", "products.list"],
  },
  {
    id: 1,
    email: "test@test.com",
    password: "12345",
    roles: ["products.list"],
  },
];

const products = [
  { id: 1, item: "product 1" },
  { id: 2, item: "product 2" },
];
const hash = (password) =>
  createHash("sha256").update(password, "utf-8").digest("hex");

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = hash(password);

  users.push({ email, password: hashedPassword });

  res.send("Registered Successfully");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);

  if (!user || user.password !== password)
    return res
      .status(401)
      .json({ status: "error", message: "Unauthenticated" });

  const token = jwt.sign(user, process.env.JWT_SECRET);

  return res.status(200).json({ ...user, token });
});

const verifyToken = (req, res, next) => {
  try {
    const [_, token] = req.headers.authorization?.split(" ");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Unauthenticated" });
  }
};

const checkRoles = (role) => (req, res, next) => {
  if (!req.user)
    return res
      .status(401)
      .json({ status: "error", message: "Unauthenticated" });

  if (!req.user.roles.includes(role))
    return res.status(403).json({ status: "error", message: "UnAuthorized" });

  next();
};

app.get("/products", [verifyToken, checkRoles("products.list")], (req, res) => {
  return res.send(products);
});

app.get(
  "/products/:id",
  [verifyToken, checkRoles("products.read")],
  (req, res) => {
    return res.send(products.find((el) => el.id == req.params.id));
  }
);

app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
