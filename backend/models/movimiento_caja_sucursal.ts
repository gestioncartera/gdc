import db from "../db/db";

export interface MovimientoCajaSucursal {
    movimiento_id?: number;
    caja_sucursal_id: number;
    usuario_responsable_id: number;
    tipo_movimiento:string
    monto: number;
    descripcion: string;
    fecha_movimiento?: Date;
    
}

export const createMovimientoCajaSucursal = async (movimiento: MovimientoCajaSucursal): Promise<MovimientoCajaSucursal> => {
    const result = await db.query(
        `INSERT INTO movimientos_caja_sucursal (
            caja_sucursal_id,
            usuario_responsable_id,
            tipo_movimiento,
            monto,
            descripcion,
            fecha_movimiento
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
            movimiento.caja_sucursal_id,
            movimiento.usuario_responsable_id,
            movimiento.tipo_movimiento ,// 'ingreso' o 'egreso'
            movimiento.monto,
            movimiento.descripcion,
            movimiento.fecha_movimiento ||new Date().toISOString().slice(0, 10) // Solo la fecha sin hora
        ]
    );
    return result.rows[0];
};

export const getMovimientosByCajaSucursalId = async (caja_sucursal_id: number): Promise<MovimientoCajaSucursal[]> => {
    const result = await db.query(
        `SELECT * FROM movimientos_caja_sucursal
        WHERE caja_sucursal_id = $1 ORDER BY fecha_movimiento DESC`,
        [caja_sucursal_id]
    );
    return result.rows;
};

export default {
    createMovimientoCajaSucursal,
    getMovimientosByCajaSucursalId
};