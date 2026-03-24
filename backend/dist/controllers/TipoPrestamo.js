"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTipoPrestamo = exports.updateTipoPrestamo = exports.getTipoPrestamoById = exports.getTiposPrestamo = exports.createTipoPrestamo = void 0;
const TipoPrestamo_1 = __importDefault(require("../models/TipoPrestamo"));
// Crear tipo de préstamo
const createTipoPrestamo = async (req, res) => {
    try {
        if (req.body.cantidad_cuotas === undefined || req.body.porcentaje === undefined || req.body.nombre === undefined) {
            return res.status(400).send({ error: 'La cantidad de cuotas, el porcentaje y el nombre son obligatorios' });
        }
        const tipoPrestamo = req.body;
        const newTipoPrestamo = await TipoPrestamo_1.default.createTipoPrestamo(tipoPrestamo);
        return (!newTipoPrestamo)
            ? res.status(500).send({ error: 'No se pudo crear el tipo de préstamo' })
            : res.status(201).send({ message: 'Tipo de préstamo creado exitosamente' });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al crear el tipo de préstamo' });
    }
};
exports.createTipoPrestamo = createTipoPrestamo;
// Obtener todos los tipos de préstamo
const getTiposPrestamo = async (req, res) => {
    try {
        const idSucursal = parseInt(req.params.sucursal_id);
        const tiposPrestamo = await TipoPrestamo_1.default.getTiposPrestamo(idSucursal);
        return (!tiposPrestamo)
            ? res.status(500).send({ error: 'No existen tipos de préstamo creados' })
            : res.status(200).json(tiposPrestamo);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener los tipos de préstamo' });
    }
};
exports.getTiposPrestamo = getTiposPrestamo;
//obtener tipo de prestamo por id
const getTipoPrestamoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tipoPrestamo = await TipoPrestamo_1.default.getTipoPrestamoById(id);
        if (tipoPrestamo.length === 0) {
            return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
        }
        return res.status(200).json(tipoPrestamo[0]);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener el tipo de préstamo' });
    }
};
exports.getTipoPrestamoById = getTipoPrestamoById;
//actualizar tipo de préstamo
const updateTipoPrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tipoPrestamo = req.body;
        const updatedTipoPrestamo = await TipoPrestamo_1.default.updateTipoPrestamo(id, tipoPrestamo);
        if (!updatedTipoPrestamo) {
            return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
        }
        return res.status(200).send(updatedTipoPrestamo);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al actualizar el tipo de préstamo' });
    }
};
exports.updateTipoPrestamo = updateTipoPrestamo;
// Eliminar tipo de préstamo
const deleteTipoPrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedTipoPrestamo = await TipoPrestamo_1.default.deleteTipoPrestamo(id);
        if (!deletedTipoPrestamo) {
            return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
        }
        return res.status(200).send({ message: 'Tipo de préstamo eliminado exitosamente' });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al eliminar el tipo de préstamo' });
    }
};
exports.deleteTipoPrestamo = deleteTipoPrestamo;
exports.default = {
    createTipoPrestamo: exports.createTipoPrestamo,
    getTiposPrestamo: exports.getTiposPrestamo,
    getTipoPrestamoById: exports.getTipoPrestamoById,
    updateTipoPrestamo: exports.updateTipoPrestamo,
    deleteTipoPrestamo: exports.deleteTipoPrestamo
};
