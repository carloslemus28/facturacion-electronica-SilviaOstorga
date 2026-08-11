const express = require('express');

const productsController = require('./products.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!Array.isArray(req.user?.roles) || !req.user.roles.includes('ADMIN')) {
    return res.status(403).json({
      ok: false,
      message: 'Solo el usuario administrador puede descargar este archivo CSV'
    });
  }

  return next();
};


router.get(
  '/export/csv',
  authenticate,
  requireAdmin,
  authorize('PRODUCTS_MANAGE'),
  productsController.downloadProductsCsv
);

router.get(
  '/',
  authenticate,
  authorize('PRODUCTS_MANAGE'),
  productsController.listProducts
);

router.get(
  '/:id',
  authenticate,
  authorize('PRODUCTS_MANAGE'),
  productsController.getProductById
);

router.post(
  '/',
  authenticate,
  authorize('PRODUCTS_MANAGE'),
  productsController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('PRODUCTS_MANAGE'),
  productsController.updateProduct
);

module.exports = router;