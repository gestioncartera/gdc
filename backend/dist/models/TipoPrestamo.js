"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTipoPrestamoById = exports.updateTipoPrestamo = exports.deleteTipoPrestamo = exports.getTiposPrestamo = exports.createTipoPrestamo = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear un nuevo tipo de préstamo
const createTipoPrestamo = async (tipoPrestamo) => {
    const newTipoPrestamo = await db_1.default.query('INSERT INTO tipo_prestamo (sucursal_id, cantidad_cuotas, porcentaje, nombre) VALUES ($1, $2, $3, $4) RETURNING *', [
        tipoPrestamo.sucursal_id,
        tipoPrestamo.cantidad_cuotas,
        tipoPrestamo.porcentaje,
        tipoPrestamo.nombre || 'Prestamo ' + tipoPrestamo.cantidad_cuotas + 'cuotas'
    ]);
    return newTipoPrestamo.rows[0] || null;
};
exports.createTipoPrestamo = createTipoPrestamo;
// Obtener todos los tipos de préstamo
const getTiposPrestamo = async (idSucursal) => {
    const result = await db_1.default.query('SELECT * FROM tipo_prestamo WHERE sucursal_id = $1', [idSucursal]);
    return result.rows;
};
exports.getTiposPrestamo = getTiposPrestamo;
// Eliminar tipo de préstamo
const deleteTipoPrestamo = async (id) => {
    const deletedTipoPrestamo = await db_1.default.query('DELETE FROM tipo_prestamo WHERE id_tipo_prestamo = $1 RETURNING *', [id]);
    return deletedTipoPrestamo.rows[0] || null;
};
exports.deleteTipoPrestamo = deleteTipoPrestamo;
// Actualizar tipo de préstamo
const updateTipoPrestamo = async (id, tipoPrestamo) => {
    const updatedTipoPrestamo = await db_1.default.query('UPDATE tipo_prestamo SET sucursal_id = $1, cantidad_cuotas = $2, porcentaje = $3, nombre= $4 WHERE id_tipo_prestamo = $5 RETURNING *', [
        tipoPrestamo.sucursal_id,
        tipoPrestamo.cantidad_cuotas,
        tipoPrestamo.porcentaje,
        tipoPrestamo.nombre,
        id
    ]);
    return updatedTipoPrestamo.rows[0] || null;
};
exports.updateTipoPrestamo = updateTipoPrestamo;
//buscar tipo de prestamo por id
const getTipoPrestamoById = async (id) => {
    const result = await db_1.default.query('SELECT * FROM tipo_prestamo WHERE id_tipo_prestamo = $1', [id]);
    return result.rows;
};
exports.getTipoPrestamoById = getTipoPrestamoById;
exports.default = {
    createTipoPrestamo: exports.createTipoPrestamo,
    getTiposPrestamo: exports.getTiposPrestamo,
    deleteTipoPrestamo: exports.deleteTipoPrestamo,
    updateTipoPrestamo: exports.updateTipoPrestamo,
    getTipoPrestamoById: exports.getTipoPrestamoById
};
