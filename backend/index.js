const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();

// ✅ Use PORT from environment or fallback to 4000
const port = process.env.PORT || 4000;

// ✅ Use Mongo URI from environment or fallback to local
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://devanshkushwah90:Dev2005@cluster0.swmpxgd.mongodb.net/E-Commerce?retryWrites=true&w=majority";

// Middleware
app.use(express.json());
app.use(cors());
app.use("/images", express.static("upload/images"));
app.use(express.urlencoded({ extended: true }));

// Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RNoJZSZrkLgxK7",
  key_secret: process.env.RAZORPAY_SECRET || "msw5Wxh6NtW6eg3O7YYpP03s",
});

// --------------------
// MongoDB Connection
// --------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --------------------
// Multer setup for images
// --------------------
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// --------------------
// Schemas
// --------------------
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  images: { type: [String], default: [] },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  sizes: { type: [String], default: [] },
  quantity: { type: Number, default: 0 },
  description: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});
const Product = mongoose.model("Product", productSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model("User", userSchema);

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    { productId: { type: Number, required: true }, quantity: { type: Number, default: 1 }, size: { type: String, default: "" } },
  ],
});
const Cart = mongoose.model("Cart", cartSchema);

// --------------------
// Routes
// --------------------

// Root
app.get("/", (req, res) => res.send("Express App is running..."));

// Upload image
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, image_url: `${req.protocol}://${req.get("host")}/images/${req.file.filename}` });
});

// Products APIs
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    const product = new Product({ id, ...req.body });
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Users APIs
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ success: true, message: "User registered", userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secretkey", { expiresIn: "1d" });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cart APIs
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json({ success: true, items: cart ? cart.items : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/cart/:userId/add", async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, items: [] });

    const existingItem = cart.items.find((i) => i.productId === productId && i.size === size);
    if (existingItem) existingItem.quantity += quantity || 1;
    else cart.items.push({ productId, size, quantity: quantity || 1 });

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------
// Start server
// --------------------
app.listen(port, () => console.log(`Server running at ${port}`));
