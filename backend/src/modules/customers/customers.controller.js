const customersService = require('./customers.service');
const { setCsvDownloadHeaders } = require('../../utils/csv-stream');

const listCustomers = async (req, res, next) => {
  try {
    const customers = await customersService.listCustomers({
      query: req.query,
      user: req.user
    });

    res.set('Cache-Control', 'no-store');

    res.status(200).json({
      ok: true,
      customers
    });
  } catch (error) {
    next(error);
  }
};


const downloadCustomersCsv = async (req, res, next) => {
  try {
    const dateKey = new Date().toISOString().slice(0, 10);

    setCsvDownloadHeaders(res, `clientes-${dateKey}.csv`);

    await customersService.streamCustomersCsv({
      query: req.query,
      user: req.user,
      stream: res
    });

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    res.end();
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customersService.getCustomerById(req.params.id, {
      user: req.user
    });

    res.status(200).json({
      ok: true,
      customer
    });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.createCustomer({
      data: req.body,
      user: req.user
    });

    res.status(201).json({
      ok: true,
      message: 'Cliente registrado correctamente',
      customer
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.updateCustomer(req.params.id, {
      data: req.body,
      user: req.user
    });

    res.status(200).json({
      ok: true,
      message: 'Cliente actualizado correctamente',
      customer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCustomers,
  downloadCustomersCsv,
  getCustomerById,
  createCustomer,
  updateCustomer
};