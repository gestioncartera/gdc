"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSucursalById = getSucursalById;
exports.getSucursalByName = getSucursalByName;
exports.getSucursales = getSucursales;
exports.createSucursal = createSucursal;
exports.updateSucursal = updateSucursal;
exports.deleteSucursal = deleteSucursal;
const db_1 = __importDefault(require("../db/db"));
//Buscar una sucursal por ID
async function getSucursalById(id) {
    const result = await db_1.default.query('SELECT * FROM sucursales WHERE sucursal_id = $1', [
        id
    ]);
    return result.rows[0] || null;
}
//buscar una sucursal por nombre
async function getSucursalByName(nombre) {
    const result = await db_1.default.query('SELECT * FROM sucursales WHERE nombre = $1', [
        nombre
    ]);
    return result.rows[0] || null;
}
// Obtener todas las sucursales
async function getSucursales() {
    const result = await db_1.default.query('SELECT * FROM sucursales order by sucursal_id asc');
    return result.rows;
}
// Crear una nueva sucursal con transacción (Caja + Ruta)
async function createSucursal(sucursal) {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Crear Sucursal
        const newSucursalRes = await client.query(`INSERT INTO sucursales (nombre, direccion, telefono, fecha_creacion, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [
            sucursal.nombre,
            sucursal.direccion,
            sucursal.telefono || null,
            sucursal.fecha_creacion || new Date().toISOString().slice(0, 10),
            sucursal.estado || 'activo'
        ]);
        const newSucursal = newSucursalRes.rows[0];
        if (!newSucursal) {
            throw new Error('No se pudo crear la sucursal');
        }
        // 2. Crear Caja Inicial
        await client.query(`INSERT INTO cajas_sucursales (sucursal_id, saldo_actual, fecha_ultima_actualizacion) 
       VALUES ($1, $2, NOW())`, [newSucursal.sucursal_id, 0]);
        // 3. Crear Ruta Default
        const nombreRuta = `Ruta General - ${newSucursal.nombre}`;
        await client.query(`INSERT INTO rutas (sucursal_id,
       nombre_ruta, 
       descripcion, 
       zona, 
       fecha_creacion,
       estado, 
       created_at)
       VALUES ($1, $2, $3, $4, $5,$6, NOW())`, [
            newSucursal.sucursal_id,
            nombreRuta,
            'Ruta inicial generada automáticamente',
            'General',
            new Date().toISOString(),
            'activo'
        ]);
        await client.query('COMMIT');
        return newSucursal;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// Actualizar una sucursal
async function updateSucursal(id, sucursal) {
    const res = await db_1.default.query(`UPDATE sucursales SET nombre=$1, direccion=$2, telefono=$3, estado=$4 WHERE sucursal_id=$5  RETURNING *`, [
        sucursal.nombre,
        sucursal.direccion,
        sucursal.telefono,
        sucursal.estado,
        id
    ]);
    return res.rows[0] || null;
}
// Eliminar una sucursal
async function deleteSucursal(id) {
    await db_1.default.query(`DELETE FROM sucursales WHERE sucursal_id=$1  RETURNING *`, [id]);
}
exports.default = {
    getSucursalById,
    getSucursalByName,
    getSucursales,
    createSucursal,
    updateSucursal,
    deleteSucursal
};
