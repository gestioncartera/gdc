"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hayEgresosNew = exports.anularMovimientoCajaSucursal = exports.getMovimientosByCajaSucursalId = exports.getMovimientoById = exports.createMovimientoCajaSucursal = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear movimiento y actualizar saldo automáticamente con una transacción
const createMovimientoCajaSucursal = async (movimiento) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        //validar saldo en caja para movimientos de egreso 
        //const cajaSucursal
        // 1. Insertar Movimiento
        const movtocaja = await client.query(`INSERT INTO movimientos_caja_sucursal (
                caja_sucursal_id,
                usuario_responsable_id,
                tipo_movimiento,
                monto,
                descripcion,
                fecha_movimiento,
                estado_movto
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [movimiento.caja_sucursal_id,
            movimiento.usuario_responsable_id,
            movimiento.tipo_movimiento,
            movimiento.monto,
            movimiento.descripcion,
            movimiento.fecha_movimiento || new Date().toISOString(),
            movimiento.estado_movto || 'confirmado'
        ]);
        const nuevoMovimiento = movtocaja.rows[0];
        // 2. Actualizar Saldo Caja
        const updatecaja = await client.query(`UPDATE cajas_sucursales 
            SET saldo_actual = saldo_actual + $2, 
            fecha_ultima_actualizacion = NOW() 
            WHERE caja_sucursal_id = $1 RETURNING *`, [movimiento.caja_sucursal_id,
            movimiento.tipo_movimiento === 'ingreso' ? movimiento.monto : -movimiento.monto,
        ]);
        await client.query('COMMIT');
        return nuevoMovimiento;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createMovimientoCajaSucursal = createMovimientoCajaSucursal;
const getMovimientoById = async (movimiento_id) => {
    const result = await db_1.default.query(`SELECT * FROM movimientos_caja_sucursal
        WHERE movimiento_id = $1`, [movimiento_id]);
    return result.rows[0] || null;
};
exports.getMovimientoById = getMovimientoById;
const getMovimientosByCajaSucursalId = async (caja_sucursal_id) => {
    const result = await db_1.default.query(`SELECT * FROM movimientos_caja_sucursal
        WHERE caja_sucursal_id = $1 ORDER BY fecha_movimiento DESC`, [caja_sucursal_id]);
    return result.rows;
};
exports.getMovimientosByCajaSucursalId = getMovimientosByCajaSucursalId;
//anular movimiento
const anularMovimientoCajaSucursal = async (movimiento_id) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const result = await db_1.default.query(`UPDATE movimientos_caja_sucursal 
        SET estado_movto = 'anulado'
        WHERE movimiento_id = $1  RETURNING *`, [movimiento_id]);
        // 2. Actualizar Saldo Caja
        const updatecaja = await client.query(`UPDATE cajas_sucursales 
            SET saldo_actual = saldo_actual + $2, 
            fecha_ultima_actualizacion = NOW() 
            WHERE caja_sucursal_id = $1  RETURNING *`, [result.rows[0].caja_sucursal_id,
            result.rows[0].tipo_movimiento === 'ingreso' ? -result.rows[0].monto : result.rows[0].monto,
        ]);
        if (!updatecaja.rows[0]) {
            throw new Error('No se pudo actualizar el saldo de la caja');
        }
        await client.query('COMMIT');
        return result.rows[0] || null;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.anularMovimientoCajaSucursal = anularMovimientoCajaSucursal;
const hayEgresosNew = async (movimiento) => {
    const result = await db_1.default.query(`SELECT COUNT(*) FROM movimientos_caja_sucursal
        WHERE fecha_movimiento > $1 
        AND     caja_sucursal_id = $2
        and tipo_movimiento = 'egreso'`, [movimiento.fecha_movimiento, movimiento.caja_sucursal_id]);
    return result.rows[0].count > 0;
};
exports.hayEgresosNew = hayEgresosNew;
exports.default = {
    createMovimientoCajaSucursal: exports.createMovimientoCajaSucursal,
    getMovimientosByCajaSucursalId: exports.getMovimientosByCajaSucursalId,
    anularMovimientoCajaSucursal: exports.anularMovimientoCajaSucursal,
    getMovimientoById: exports.getMovimientoById,
    hayEgresosNew: exports.hayEgresosNew
};
