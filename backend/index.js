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

// --------------------
// Environment Variables
// --------------------
const port = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/images", express.static("upload/images"));

// --------------------
// MongoDB Connection
// --------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --------------------
// Multer setup (for image uploads)
// --------------------
const fs = require('fs');
if (!fs.existsSync('./upload/images')) {
  fs.mkdirSync('./upload/images', { recursive: true });
}

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// --------------------
// Razorpay setup
// --------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// --------------------
// Schemas & Models
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
    {
      productId: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
      size: { type: String, default: "" },
    },
  ],
});
const Cart = mongoose.model("Cart", cartSchema);

// --------------------
// Routes
// --------------------

// ✅ Root Route
app.get("/", (req, res) => res.send("🚀 E-Commerce Backend is running..."));

// ✅ Upload image
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({
    success: true,
    image_url: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
  });
});

// ✅ Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get single product by ID
app.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ id: Number(id) });
    }

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Add new product
app.post("/addproduct", upload.single("image"), async (req, res) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    // Create image URL (if image is uploaded)
    const imageUrl = req.file
      ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
      : "";

    const productData = {
      id,
      name: req.body.name,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      sizes: req.body.sizes ? req.body.sizes.split(",") : [],
      quantity: req.body.quantity,
      description: req.body.description,
      images: [imageUrl], // ✅ Store uploaded image URL in MongoDB
    };

    const product = new Product(productData);
    await product.save();

    res.json({ success: true, message: "Product added successfully!", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Register user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get user cart
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json({ success: true, items: cart ? cart.items : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Add to cart
app.post("/cart/:userId/add", async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, items: [] });

    const existingItem = cart.items.find(
      (i) => i.productId === productId && i.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ productId, size, quantity: quantity || 1 });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Remove one item from cart
app.post("/cart/:userId/removeOne", async (req, res) => {
  try {
    const { productId, size } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.json({ success: true, cart: { items: [] } });

    const existingItem = cart.items.find(
      (i) => i.productId === productId && i.size === (size || "")
    );

    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1;
      } else {
        cart.items = cart.items.filter(
          (i) => !(i.productId === productId && i.size === (size || ""))
        );
      }
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Remove all of a product from cart
app.post("/cart/:userId/removeAll", async (req, res) => {
  try {
    const { productId, size } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.json({ success: true, cart: { items: [] } });

    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && i.size === (size || ""))
    );

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Delete product (for admin)
app.delete("/removeproduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findByIdAndDelete(id);
    }
    if (!product) {
      product = await Product.findOneAndDelete({ id: Number(id) });
    }
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product removed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Create Razorpay Order
app.post("/payment/orders/:userId", async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Verify Razorpay Payment
app.post("/payment/verify", async (req, res) => {
  try {
    const crypto = require("crypto");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Clear cart (after successful payment)
app.post("/cart/:userId/clear", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------
// Start Server
// --------------------
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
