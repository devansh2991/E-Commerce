require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");

const app = express();

const port = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin.includes("localhost") ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use("/images", express.static("upload/images"));

let isConnected = false;

async function connectDB() {
  if (!MONGO_URI) throw new Error("MONGO_URI not set");

  if (isConnected) return;

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const conn = await mongoose.connect(MONGO_URI);
  isConnected = conn.connections[0].readyState === 1;

  console.log("MongoDB Connected");
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ success: false, message: "DB connection failed" });
  }
});

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const Product = mongoose.model("Product", new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  images: [String],
  category: String,
  new_price: Number,
  old_price: Number,
  sizes: [String],
  quantity: Number,
  description: String,
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
}));

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
}));

const Cart = mongoose.model("Cart", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      productId: Number,
      quantity: Number,
      size: String,
    }
  ]
}));

app.get("/", (req, res) => {
  res.send("Server running");
});

// Upload
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false });

  res.json({
    success: true,
    image_url: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
  });
});

// Products
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, products });
});

// Add product
app.post("/addproduct", upload.single("image"), async (req, res) => {
  const last = await Product.findOne().sort({ id: -1 });
  const id = last ? last.id + 1 : 1;

  const imageUrl = req.file
    ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    : "";

  const product = new Product({
    id,
    name: req.body.name,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    sizes: req.body.sizes?.split(",") || [],
    quantity: req.body.quantity,
    description: req.body.description,
    images: [imageUrl],
  });

  await product.save();
  res.json({ success: true, product });
});

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  res.json({ success: true, userId: user._id });
});

// Login
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ message: "Invalid" });

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid" });

  const token = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ success: true, token });
});

// Payment
app.post("/cart/payment/order/:userId", async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart empty" });
  }

  let total = 0;

  for (const item of cart.items) {
    const product = await Product.findOne({ id: item.productId });
    if (product) total += product.new_price * item.quantity;
  }

  const order = await razorpay.orders.create({
    amount: total * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`
  });

  res.json(order);
});

if (require.main === module && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(port, () => console.log(`Running on ${port}`));
  });
}

module.exports = { app, connectDB };