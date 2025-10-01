const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const axios = require("axios");

const app = express();
const port = 4000;

const Razorpay = require("razorpay");
const crypto = require("crypto");

// Middleware
app.use(express.json());
app.use(cors());
app.use("/images", express.static("upload/images"));
app.use(express.urlencoded({ extended: true }));

const razorpay = new Razorpay({
  key_id: "rzp_test_RNoJZSZrkLgxK7",
  key_secret: "msw5Wxh6NtW6eg3O7YYpP03s",
});

// Payment order API
// Payment order API
app.post("/payment/orders/:userId", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert rupees to paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    });

    res.json({
      success: true,
      id: order.id,
      currency: order.currency,
      amount: order.amount, // already in paise
    });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Verify payment
app.post("/payment/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET) // ✅ always from env
      .update(sign)
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
});


// MongoDB Connection

const MONGO_URI = "mongodb+srv://devanshkushwah90:Dev2005@cluster0.swmpxgd.mongodb.net/E-Commerce?retryWrites=true&w=majority";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));


// Multer Setup for Image Upload

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Product Schema

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  images: { type: [String], default: [] }, // changed from single image to multiple images
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  sizes: { type: [String], default: [] }, // new field for sizes
  quantity: { type: Number, default: 0 }, // new field for available quantity
  description: { type: String, default: "" }, // optional description
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});


const Product = mongoose.model("Product", productSchema);


// User Schema

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

// Cart Schema

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: Number, required: true }, // numeric product ID
      quantity: { type: Number, default: 1 },
      size: { type: String, default: "" },
    },
  ],
});

const Cart = mongoose.model("Cart", cartSchema);


// Cart APIs


// Get user's cart
app.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!cart) return res.json({ success: true, items: [] });
    res.json({ success: true, items: cart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add product to cart
app.post("/cart/:userId/add", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!cart) {
      cart = new Cart({ userId: new mongoose.Types.ObjectId(userId), items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId === productId && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ productId, size, quantity: quantity || 1 });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove one quantity from cart
app.post("/cart/:userId/removeOne", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, size } = req.body;

    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find((i) => i.productId === productId && i.size === size);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart.items = cart.items.filter((i) => i !== item);
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove all quantities of a product from cart
app.post("/cart/:userId/removeAll", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, size } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    if (productId === undefined || size === undefined) {
      return res.status(400).json({ success: false, message: "productId and size are required" });
    }

    const result = await Cart.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $pull: { items: { productId: Number(productId), size } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    console.error("RemoveAll Error:", err);
    res.status(500).json({ success: false, message: "Server error while removing item" });
  }
});




// Routes


// Root
app.get("/", (req, res) => {
  res.send("Express App is running...");
});

// Image upload
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, image_url: `http://localhost:${port}/images/${req.file.filename}` });
});


// Product APIs

// Add product
app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
      id,
      name: req.body.name,
      images: req.body.images || [],   // now supports multiple images
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      sizes: req.body.sizes || [],
      quantity: req.body.quantity || 0,
      description: req.body.description || "",
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get product by numeric ID
app.get("/product/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Edit product by numeric ID
app.put("/product/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const updatedData = {
      name: req.body.name,
      images: req.body.images || [], // supports multiple images
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      sizes: req.body.sizes || [],
      quantity: req.body.quantity || 0,
      description: req.body.description || "",
    };

    const updatedProduct = await Product.findOneAndUpdate({ id: productId }, updatedData, { new: true });

    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, updatedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Delete product by numeric ID
app.delete("/product/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const deletedProduct = await Product.findOneAndDelete({ id: productId });
    if (!deletedProduct) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, deletedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// User APIs


// Register user
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
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, "secretkey", { expiresIn: "1d" });

    res.json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Start Server

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
