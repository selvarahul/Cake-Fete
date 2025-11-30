// backend/routes/products.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const Product = require('../models/Product'); // adjust path if your models folder differs
const upload = require('../middleware/upload'); // multer middleware, expects upload.single('image')
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * Helper: build absolute path to uploaded file from imageUrl field stored in DB.
 * Accepts imageUrl like '/uploads/filename.jpg' or 'uploads/filename.jpg'.
 */
function getAbsoluteImagePath(imageUrl) {
  if (!imageUrl) return null;
  // remove leading slash if present
  const rel = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  // path is relative to project root (assumes uploads under backend/public/uploads)
  return path.join(__dirname, '..', rel);
}

/**
 * GET /api/products
 * Public: returns all products (non-deleted).
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['id', 'DESC']] });
    res.json(products);
  } catch (err) {
    console.error('Get products error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/products/:id
 * Public: returns single product by id
 */
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error('Get product error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/products
 * Admin-only. multipart/form-data with field 'image' for file upload.
 * Expects form fields: name (required), price, description, category, inStock
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, price, description, category, inStock } = req.body;

      if (!name) return res.status(400).json({ error: 'Product name required' });
      if (!req.file) return res.status(400).json({ error: 'Product image required' });

      const imageUrl = path.posix.join('/uploads', req.file.filename); // store as '/uploads/filename'

      const product = await Product.create({
        name,
        price: price ? parseFloat(price) : 0.0,
        description: description || null,
        category: category || null,
        imageUrl,
        inStock: inStock === undefined ? true : (inStock === 'false' ? false : Boolean(inStock))
      });

      return res.status(201).json(product);
    } catch (err) {
      console.error('Create product error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * PUT /api/products/:id
 * Admin-only. Optionally replace image by sending new image file in 'image' field.
 * Accepts form-data.
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      const p = await Product.findByPk(req.params.id);
      if (!p) return res.status(404).json({ error: 'Not found' });

      const { name, price, description, category, inStock } = req.body;
      if (name !== undefined) p.name = name;
      if (price !== undefined) p.price = parseFloat(price);
      if (description !== undefined) p.description = description;
      if (category !== undefined) p.category = category;
      if (inStock !== undefined) p.inStock = inStock === 'false' ? false : Boolean(inStock);

      // if new image uploaded, delete old file and update imageUrl
      if (req.file) {
        // delete old image file if exists
        if (p.imageUrl) {
          const abs = getAbsoluteImagePath(p.imageUrl);
          try {
            if (abs && fs.existsSync(abs)) {
              fs.unlinkSync(abs);
              console.log('Deleted previous image file:', abs);
            }
          } catch (fsErr) {
            console.warn('Failed to delete previous image file:', abs, fsErr);
            // continue - do not block update
          }
        }

        p.imageUrl = path.posix.join('/uploads', req.file.filename);
      }

      await p.save();
      res.json(p);
    } catch (err) {
      console.error('Update product error', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Admin-only. Deletes DB row and removes the image file from disk if present.
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });

    // remove file from disk
    if (p.imageUrl) {
      const abs = getAbsoluteImagePath(p.imageUrl);
      try {
        if (abs && fs.existsSync(abs)) {
          fs.unlinkSync(abs);
          console.log('Deleted image file:', abs);
        }
      } catch (fsErr) {
        console.warn('Failed to delete image file:', abs, fsErr);
        // do not fail the request on file delete error
      }
    }

    await p.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete product error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
