// server.js
require("dotenv").config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();


// ============= CORS CONFIGURATION =============
app.use(cors({
  origin: [
    'https://cordi-cart-working-model-git-main-uminoreen.vercel.app',
    'https://cordi-cart-working-model.vercel.app',
    'https://cordi-cart.vercel.app',
    'https://cordi-cart.onrender.com',
    'http://localhost:4200',
    'http://127.0.0.1:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Increase payload size limits for large images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cordicart')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ... rest of your code
// ============= SCHEMAS =============

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seller', 'buyer'], default: 'buyer' },
  avatar: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: {
    street: String,
    city: String,
    province: String,
    zipCode: String
  },
  storeName: { type: String, default: "" },
  storeDescription: { type: String, default: "" },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

// Product Schema - UPDATED: Images stored as binary data
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  images: [{ 
    data: Buffer,      // Binary image data
    contentType: String, // MIME type (image/jpeg, image/png, etc.)
    filename: String    // Original filename
  }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String },
  origin: { type: String, default: 'Benguet' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }]
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    fullName: String,
    street: String,
    city: String,
    province: String,
    zipCode: String,
    phone: String
  },
  paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['preparing', 'out_for_delivery', 'delivered', 'failed'],
    default: 'preparing'
  },
  trackingNumber: { type: String, default: "" },
  estimatedDelivery: Date,
  createdAt: { type: Date, default: Date.now }
});

// Delivery Tracking Schema
const deliveryTrackingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  location: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  description: { type: String }
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);
const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingSchema);

// ============= MIDDLEWARE =============

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const isSeller = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Seller access required' });
  }
  next();
};

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ============= AUTH ROUTES =============

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role: role || 'buyer',
      isApproved: true
    });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ 
      message: 'User created successfully', 
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);
    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= USER ROUTES =============

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= CATEGORY ROUTES =============

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= PRODUCT ROUTES =============

// GET all products - PUBLIC
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const products = await Product.find(query)
      .populate('seller', 'username storeName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Convert binary images to base64 for display
    const productsWithImages = products.map(product => {
      const productObj = product.toObject();
      
      if (productObj.images && productObj.images.length > 0) {
        productObj.images = productObj.images.map(img => {
          if (img && img.data && img.contentType) {
            const base64 = img.data.toString('base64');
            return `data:${img.contentType};base64,${base64}`;
          }
          return null;
        }).filter(Boolean);
      }
      
      return productObj;
    });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products: productsWithImages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET single product - PUBLIC
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username storeName storeDescription');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productObj = product.toObject();
    
    if (productObj.images && productObj.images.length > 0) {
      productObj.images = productObj.images.map(img => {
        if (img && img.data && img.contentType) {
          const base64 = img.data.toString('base64');
          return `data:${img.contentType};base64,${base64}`;
        }
        return null;
      }).filter(Boolean);
    }
    
    res.json(productObj);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT - Update product (Admin or Product Owner)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && product.seller.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - Remove product (Admin or Product Owner)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`🗑️ Deleting product: ${req.params.id}`);
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log('❌ Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && product.seller.toString() !== req.user.userId) {
      console.log('❌ Unauthorized - User is not the seller');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    console.log('✅ Product deleted successfully');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= CART ROUTES =============

// GET cart
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.userId })
      .populate({
        path: 'items.product',
        populate: { path: 'seller', select: 'username storeName' }
      });
      
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ADD to cart
app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: req.user.userId });
    
    const product = await Product.findById(productId).populate('seller', 'username');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: { path: 'seller', select: 'username storeName' }
    });
    
    res.json(populatedCart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({ error: error.message });
  }
});

// UPDATE cart item
app.put('/api/cart/update/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.userId });
    
    const item = cart.items.find(item => item.product.toString() === req.params.productId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
      } else {
        item.quantity = quantity;
      }
      await cart.save();
    }
    
    await cart.populate({
      path: 'items.product',
      populate: { path: 'seller', select: 'username storeName' }
    });
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// REMOVE from cart
app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId });
    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate({
      path: 'items.product',
      populate: { path: 'seller', select: 'username storeName' }
    });
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ORDER ROUTES =============

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    console.log('🛒 ORDER CREATION STARTED');
    console.log('📦 Request body:', req.body);
    console.log('👤 User ID:', req.user.userId);
    
    const { shippingAddress, paymentMethod } = req.body;
    
    const cart = await Cart.findOne({ user: req.user.userId }).populate({
      path: 'items.product',
      populate: { path: 'seller', select: 'username storeName' }
    });
    
    console.log('🛒 Cart found:', cart ? 'Yes' : 'No');
    console.log('🛒 Cart items count:', cart?.items?.length || 0);
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    const itemsBySeller = {};
    
    for (const item of cart.items) {
      console.log(`📦 Processing item: ${item.product.name}`);
      
      const sellerId = (item.product.seller?._id || item.product.seller).toString();
      
      if (!sellerId) {
        console.error(`ERROR: Product ${item.product.name} has no seller!`);
        continue;
      }
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = {
          sellerId: sellerId,
          items: [],
          totalAmount: 0
        };
      }
      const itemTotal = item.product.price * item.quantity;
      itemsBySeller[sellerId].items.push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        sellerId: sellerId
      });
      itemsBySeller[sellerId].totalAmount += itemTotal;
    }
    
    console.log(`Items grouped into ${Object.keys(itemsBySeller).length} seller(s)`);
    
    const createdOrders = [];
    
    for (const sellerId in itemsBySeller) {
      const sellerData = itemsBySeller[sellerId];
      
      const order = new Order({
        orderNumber: generateOrderNumber(),
        user: req.user.userId,
        items: sellerData.items,
        totalAmount: sellerData.totalAmount,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        orderStatus: 'pending',
        deliveryStatus: 'preparing',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      await order.save();
      createdOrders.push(order);
      
      const tracking = new DeliveryTracking({
        orderId: order._id,
        status: 'preparing',
        description: 'Order confirmed, preparing for shipment'
      });
      await tracking.save();
    }
    
    cart.items = [];
    await cart.save();
    
    console.log(`✅ ${createdOrders.length} order(s) placed successfully`);
    res.status(201).json({ 
      message: 'Orders placed successfully', 
      orders: createdOrders 
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get buyer orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single order
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.userId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get order tracking
app.get('/api/orders/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const tracking = await DeliveryTracking.find({ orderId: req.params.id }).sort({ timestamp: -1 });
    res.json(tracking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= ADMIN ROUTES =============

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role, isApproved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isApproved },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'username email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
    
    res.json({
      totalUsers,
      totalSellers,
      totalBuyers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= SELLER ROUTES =============

// Get seller stats
app.get('/api/seller/stats', authenticateToken, isSeller, async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const products = await Product.find({ seller: sellerId });
    const orders = await Order.find({ 'items.sellerId': sellerId });
    
    let totalSales = 0;
    for (const order of orders) {
      const sellerItems = order.items.filter(item => 
        item.sellerId && item.sellerId.toString() === sellerId
      );
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalSales += sellerTotal;
    }
    
    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales: totalSales,
      lowStock: products.filter(p => p.stock < 10).length
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get seller products - UPDATED with binary image conversion
app.get('/api/seller/products', authenticateToken, isSeller, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.userId })
      .sort({ createdAt: -1 });
    
    // Convert binary images to base64 for display
    const productsWithImages = products.map(product => {
      const productObj = product.toObject();
      
      if (productObj.images && productObj.images.length > 0) {
        productObj.images = productObj.images.map(img => {
          if (img && img.data && img.contentType) {
            const base64 = img.data.toString('base64');
            return `data:${img.contentType};base64,${base64}`;
          }
          return null;
        }).filter(Boolean);
      }
      
      return productObj;
    });
    
    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add product - SELLER endpoint - UPDATED for binary images
app.post('/api/seller/products', authenticateToken, isSeller, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const { name, description, price, category, stock, origin, images } = req.body;
    
    const product = new Product({ 
      name,
      description,
      price,
      category,
      stock,
      origin: origin || 'Benguet',
      seller: req.user.userId,
      sellerName: user.storeName || user.username,
      images: images || []  // This will store binary image data
    });
    
    await product.save();
    console.log('✅ Product saved by seller:', product.name);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Error saving product:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get seller orders
app.get('/api/seller/orders', authenticateToken, isSeller, async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const orders = await Order.find({ 
      'items.sellerId': sellerId 
    })
    .populate('user', 'username email')
    .sort({ createdAt: -1 });
    
    const sellerOrders = orders.map(order => {
      const sellerItems = order.items.filter(item => 
        item.sellerId && item.sellerId.toString() === sellerId
      );
      return {
        ...order.toObject(),
        items: sellerItems,
        totalAmount: sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
    });
    
    res.json(sellerOrders);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status (seller)
app.put('/api/seller/orders/:id/status', authenticateToken, isSeller, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const hasSellerItems = order.items.some(item => 
      item.sellerId && item.sellerId.toString() === req.user.userId
    );
    
    if (!hasSellerItems) {
      return res.status(403).json({ error: 'You are not authorized to update this order' });
    }
    
    order.orderStatus = orderStatus;
    await order.save();
    
    const tracking = new DeliveryTracking({
      orderId: order._id,
      status: orderStatus,
      description: `Order status updated to ${orderStatus} by seller`
    });
    await tracking.save();
    
    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      order: order 
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= IMAGE UPLOAD SETUP =============

// Configure multer for memory storage (store in buffer, not on disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

const upload = multer({ 
  storage: storage,  // Use memory storage to store in buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// ============= IMAGE UPLOAD ROUTE - UPDATED for binary storage =============
app.post('/api/upload', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    console.log(`📤 Uploading ${files.length} images to MongoDB...`);
    
    // Store images as binary data
    const imageData = files.map(file => ({
      data: file.buffer,           // The binary image data
      contentType: file.mimetype,   // e.g., image/jpeg
      filename: file.originalname   // Original filename
    }));
    
    console.log(`✅ Images stored in memory, ready to save to MongoDB`);
    
    // Return the binary data to be stored in the product
    res.json({ 
      images: imageData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= DEBUG ENDPOINTS =============

app.get('/api/debug/check-products', async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'username');
    const productInfo = products.map(p => ({
      id: p._id,
      name: p.name,
      sellerId: p.seller?._id || p.seller,
      sellerName: p.sellerName,
      imageCount: p.images ? p.images.length : 0
    }));
    res.json({
      count: products.length,
      products: productInfo
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============= CREATE ADMIN USER =============

async function createAdminIfNotExists() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({ 
        username: 'admin', 
        email: 'admin@ecommerce.com',
        password: hashedPassword, 
        role: 'admin',
        isApproved: true
      });
      await admin.save();
      console.log('✅ Admin user created - Email: admin@ecommerce.com, Password: admin123');
    }
  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
}

// ============= START SERVER =============

createAdminIfNotExists();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});