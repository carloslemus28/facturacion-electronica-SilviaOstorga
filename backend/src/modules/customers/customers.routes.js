const express = require('express');

const customersController = require('./customers.controller');
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
  authorize('CUSTOMERS_MANAGE'),
  customersController.downloadCustomersCsv
);

router.get(
  '/',
  authenticate,
  authorize('CUSTOMERS_MANAGE'),
  customersController.listCustomers
);

router.get(
  '/:id',
  authenticate,
  authorize('CUSTOMERS_MANAGE'),
  customersController.getCustomerById
);

router.post(
  '/',
  authenticate,
  authorize('CUSTOMERS_MANAGE'),
  customersController.createCustomer
);

router.put(
  '/:id',
  authenticate,
  authorize('CUSTOMERS_MANAGE'),
  customersController.updateCustomer
);

module.exports = router;