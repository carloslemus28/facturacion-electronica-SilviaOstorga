const emailsService = require('../emails/emails.service');
const dteJsonService = require('../dte/dte-json.service');
const dtePdfService = require('../dte/dte-pdf.service');
const ZipStream = require('../../utils/zip-stream');
const invoicesService = require('./invoices.service');


const sanitizeFileName = (value) => {
  return String(value || 'documento')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_');
};

const getZipFileName = ({ startDate, endDate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const from = startDate || 'inicio';
  const to = endDate || today;

  return sanitizeFileName(`dte-json-pdf-${from}_a_${to}.zip`);
};


const createGeneratedInvoice = async (req, res, next) => {
  try {
    const invoice = await invoicesService.createGeneratedInvoice({
      data: req.body,
      user: req.user
    });

    res.status(201).json({
      ok: true,
      message: 'DTE generado correctamente',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

const updateGeneratedInvoice = async (req, res, next) => {
  try {
    const invoice = await invoicesService.updateGeneratedInvoice({
      id: req.params.id,
      data: req.body,
      user: req.user
    });

    res.status(200).json({
      ok: true,
      message: 'DTE actualizado correctamente',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

const listInvoices = async (req, res, next) => {
  try {
    const invoices = await invoicesService.listInvoices({
      user: req.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    res.set('Cache-Control', 'no-store');

    res.status(200).json({
      ok: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
};


const exportInvoicesJsonPdfZip = async (req, res, next) => {
  const startDate = req.query.startDate || '';
  const endDate = req.query.endDate || '';
  const configuredBatchSize = Number(process.env.DTE_EXPORT_BATCH_SIZE || 25);
  const batchSize = Number.isFinite(configuredBatchSize) && configuredBatchSize > 0
    ? Math.min(configuredBatchSize, 50)
    : 25;

  try {
    const fileName = getZipFileName({ startDate, endDate });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');

    const zip = new ZipStream(res);
    const exportedAt = new Date().toISOString();

    await zip.addFile('LEAME.txt', [
      'Exportación de DTE generada desde Documentos emitidos.',
      `Fecha de generación del ZIP: ${exportedAt}`,
      `Fecha inicial filtrada: ${startDate || 'No especificada'}`,
      `Fecha final filtrada: ${endDate || 'No especificada'}`,
      '',
      'Carpetas:',
      '- json/: contiene la representación JSON de cada DTE.',
      '- pdf/: contiene la representación gráfica PDF de cada DTE.',
      '- errores/: solo aparece si algún documento no pudo generarse.'
    ].join('\n'));

    let lastId = 0;
    let total = 0;

    while (true) {
      const invoices = await invoicesService.listInvoicesForJsonPdfExportBatch({
        user: req.user,
        startDate,
        endDate,
        lastId,
        limit: batchSize
      });

      if (invoices.length === 0) {
        break;
      }

      for (const invoice of invoices) {
        lastId = Number(invoice.id);
        total += 1;

        const baseName = sanitizeFileName(
          invoice.controlNumber || `DTE-${invoice.id}`
        );

        try {
          const json = dteJsonService.buildStandardDteJson(invoice);

          await zip.addFile(
            `json/${baseName}.json`,
            JSON.stringify(json, null, 2)
          );
        } catch (jsonError) {
          await zip.addFile(
            `errores/${baseName}-json-error.txt`,
            jsonError.message || 'No se pudo generar el JSON del DTE'
          );
        }

        try {
          const pdfBuffer = await dtePdfService.buildDocumentPdf(invoice);

          await zip.addFile(`pdf/${baseName}.pdf`, pdfBuffer);
        } catch (pdfError) {
          await zip.addFile(
            `errores/${baseName}-pdf-error.txt`,
            pdfError.message || 'No se pudo generar el PDF del DTE'
          );
        }
      }
    }

    if (total === 0) {
      await zip.addFile(
        'SIN_DOCUMENTOS.txt',
        'No se encontraron DTE en el rango de fechas seleccionado.'
      );
    }

    await zip.finalize();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    res.end();
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoicesService.getInvoiceById(req.params.id, {
      user: req.user
    });

    res.status(200).json({
      ok: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await invoicesService.getDashboardSummary({
      user: req.user
    });

    res.set('Cache-Control', 'no-store');

    res.status(200).json({
      ok: true,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const listAvailableDocumentsForCreditNote = async (req, res, next) => {
  try {
    const invoices = await invoicesService.listAvailableDocumentsForCreditNote({
      user: req.user
    });

    res.set('Cache-Control', 'no-store');

    res.status(200).json({
      ok: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
};

const transmitReal = async (req, res, next) => {
  try {
    const invoice = await invoicesService.transmitInvoiceToHaciendaReal({
      id: req.params.id,
      user: req.user
    });

    let automaticEmail = {
      sent: false,
      skipped: false,
      message: null
    };

    const recipient = String(invoice.customer?.email || '').trim();

    if (!recipient) {
      automaticEmail = {
        sent: false,
        skipped: true,
        message: 'El cliente no tiene correo registrado para el envío automático.'
      };
    } else {
      try {
        const email = await emailsService.sendInvoiceEmail({
          id: invoice.id,
          user: req.user,
          to: recipient
        });

        automaticEmail = {
          sent: true,
          skipped: false,
          recipient: email.recipient
        };
      } catch (emailError) {
        /*
          Hacienda ya aceptó el DTE. Un fallo SMTP no debe convertir
          la transmisión fiscal en error ni revertir el documento.
        */
        console.error(
          `⚠️ DTE ${invoice.id} aceptado por Hacienda, pero no se pudo enviar el correo automático: ${emailError.message}`
        );

        automaticEmail = {
          sent: false,
          skipped: false,
          recipient,
          message: emailError.message
        };
      }
    }

    res.json({
      ok: true,
      message: 'DTE transmitido correctamente a Hacienda',
      invoice,
      automaticEmail
    });
  } catch (error) {
    next(error);
  }
};

const invalidateReal = async (req, res, next) => {
  try {
    const invoice = await invoicesService.invalidateInvoiceReal({
      id: req.params.id,
      user: req.user,
      reason: req.body.reason
    });

    let automaticEmail = {
      sent: false,
      skipped: false,
      message: null
    };

    const recipient = String(invoice.customer?.email || '').trim();

    if (!recipient) {
      automaticEmail = {
        sent: false,
        skipped: true,
        message: 'El cliente no tiene correo registrado para el envío automático.'
      };
    } else {
      try {
        const email = await emailsService.sendInvoiceEmail({
          id: invoice.id,
          user: req.user,
          to: recipient
        });

        automaticEmail = {
          sent: true,
          skipped: false,
          recipient: email.recipient
        };
      } catch (emailError) {
        /*
          Hacienda ya aceptó la anulación. Un fallo SMTP no debe convertir
          la anulación fiscal en error ni revertir el documento.
        */
        console.error(
          `⚠️ DTE ${invoice.id} anulado ante Hacienda, pero no se pudo enviar el correo automático: ${emailError.message}`
        );

        automaticEmail = {
          sent: false,
          skipped: false,
          recipient,
          message: emailError.message
        };
      }
    }

    res.json({
      ok: true,
      message: 'DTE anulado correctamente ante Hacienda',
      invoice,
      automaticEmail
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGeneratedInvoice,
  updateGeneratedInvoice,
  listInvoices,
  exportInvoicesJsonPdfZip,
  getInvoiceById,
  getDashboardSummary,
  listAvailableDocumentsForCreditNote,
  transmitReal,
  invalidateReal
};