const express = require('express');

const invoicesController = require('./invoices.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!Array.isArray(req.user?.roles) || !req.user.roles.includes('ADMIN')) {
    return res.status(403).json({
      ok: false,
      message: 'Solo el usuario administrador puede descargar esta exportación'
    });
  }

  return next();
};

router.get(
  '/',
  authenticate,
  authorize('INVOICES_VIEW'),
  invoicesController.listInvoices
);

router.get(
  '/dashboard-summary',
  authenticate,
  authorize('INVOICES_VIEW'),
  invoicesController.getDashboardSummary
);


router.get(
  '/export/json-pdf',
  authenticate,
  requireAdmin,
  authorize('INVOICES_VIEW'),
  invoicesController.exportInvoicesJsonPdfZip
);

router.get(
  '/credit-note/available-documents',
  authenticate,
  authorize('INVOICES_CREATE'),
  invoicesController.listAvailableDocumentsForCreditNote
);

router.post(
  '/generate',
  authenticate,
  authorize('INVOICES_CREATE'),
  invoicesController.createGeneratedInvoice
);

router.put(
  '/:id',
  authenticate,
  authorize('INVOICES_CREATE'),
  invoicesController.updateGeneratedInvoice
);

router.patch(
  '/:id/transmit',
  authenticate,
  authorize('INVOICES_TRANSMIT'),
  invoicesController.transmitReal
);

router.patch(
  '/:id/invalidate',
  authenticate,
  authorize('DTE_INVALIDATE'),
  invoicesController.invalidateReal
);

router.get(
  '/:id',
  authenticate,
  authorize('INVOICES_VIEW'),
  invoicesController.getInvoiceById
);

module.exports = router;