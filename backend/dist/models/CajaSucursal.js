"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCajaSucursalById = exports.getCajaSucursalBySucursalId = exports.createCajaSucursal = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear una nueva caja de sucursal
const createCajaSucursal = async (caja) => {
    const result = await db_1.default.query(`INSERT INTO cajas_sucursales (
    sucursal_id, 
    saldo_actual, 
    fecha_ultima_actualizacion
    ) VALUES ($1, $2, $3) RETURNING *`, [
        caja.sucursal_id,
        caja.saldo_actual,
        caja.fecha_ultima_actualizacion || new Date().toISOString().slice(0, 10)
    ]);
    return result.rows[0];
};
exports.createCajaSucursal = createCajaSucursal;
// Obtener la caja de una sucursal por ID
const getCajaSucursalBySucursalId = async (sucursal_id) => {
    const result = await db_1.default.query(`SELECT * FROM cajas_sucursales WHERE sucursal_id = $1`, [sucursal_id]);
    return result.rows[0] || null;
};
exports.getCajaSucursalBySucursalId = getCajaSucursalBySucursalId;
const getCajaSucursalById = async (caja_sucursal_id) => {
    const result = await db_1.default.query(`SELECT * FROM cajas_sucursales WHERE caja_sucursal_id = $1`, [caja_sucursal_id]);
    return result.rows[0] || null;
};
exports.getCajaSucursalById = getCajaSucursalById;
exports.default = {
    createCajaSucursal: exports.createCajaSucursal,
    getCajaSucursalBySucursalId: exports.getCajaSucursalBySucursalId,
    getCajaSucursalById: exports.getCajaSucursalById
};
