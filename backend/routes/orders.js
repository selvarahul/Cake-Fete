// backend/routes/orders.js

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Safe JSON parser for items
function parseItems(items) {
  try {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    return JSON.parse(items);
  } catch (err) {
    return [];
  }
}

/**************************************
 * GET /api/orders  (List all orders)
 **************************************/
router.get("/", async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["id", "DESC"]],
    });

    const formatted = orders.map((order) => {
      const row = order.toJSON();
      row.items = parseItems(row.items);
      return row;
    });

    res.json(formatted);
  } catch (err) {
    console.error("Orders GET error:", err);
    res.status(500).json({ error: "Error fetching orders" });
  }
});

/**************************************
 * POST /api/orders  (Create order)
 **************************************/
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryDate,
      deliveryTime,
      totalAmount,
      paymentMethod,
      items,
    } = req.body;

    // Basic validation
    if (
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !deliveryDate ||
      !items
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await Order.create({
      customerName,
      customerPhone,
      customerAddress,
      deliveryDate,
      deliveryTime: deliveryTime || null,
      totalAmount: parseFloat(totalAmount) || 0,
      paymentMethod: paymentMethod || null,
      items: JSON.stringify(items),
      status: "pending",
    });

    const output = order.toJSON();
    output.items = parseItems(output.items);

    res.status(201).json(output);
  } catch (err) {
    console.error("Order CREATE error:", err);
    res.status(500).json({ error: "Error creating order" });
  }
});

/**************************************
 * GET /api/orders/:id
 **************************************/
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const output = order.toJSON();
    output.items = parseItems(output.items);

    res.json(output);
  } catch (err) {
    console.error("Order GET error:", err);
    res.status(500).json({ error: "Error fetching order" });
  }
});

/**************************************
 * PUT /api/orders/:id/status
 **************************************/
router.put("/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status || order.status;
    await order.save();

    const output = order.toJSON();
    output.items = parseItems(output.items);

    res.json(output);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Error updating order status" });
  }
});

module.exports = router;
