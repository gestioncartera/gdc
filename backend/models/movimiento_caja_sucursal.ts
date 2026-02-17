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

// Crear movimiento y actualizar saldo automáticamente con una transacción
export const createMovimientoCajaSucursal = async (movimiento: MovimientoCajaSucursal): Promise<MovimientoCajaSucursal> => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Insertar Movimiento
        const movtocaja= await client.query(`INSERT INTO movimientos_caja_sucursal (
                caja_sucursal_id,
                usuario_responsable_id,
                tipo_movimiento,
                monto,
                descripcion,
                fecha_movimiento
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
             [movimiento.caja_sucursal_id,
            movimiento.usuario_responsable_id,
            movimiento.tipo_movimiento ,
            movimiento.monto,
            movimiento.descripcion,
            movimiento.fecha_movimiento || new Date().toISOString()]);



        const nuevoMovimiento = movtocaja.rows[0];

        // 2. Actualizar Saldo Caja
        const updatecaja = await client.query(`UPDATE cajas_sucursales 
            SET saldo_actual = saldo_actual + $2, 
            fecha_ultima_actualizacion = NOW() 
            WHERE caja_sucursal_id = $1 RETURNING *`,
        [movimiento.caja_sucursal_id,
            movimiento.monto,
            movimiento.tipo_movimiento === 'ingreso' ? movimiento.monto : -movimiento.monto,
        ]);
       
        await client.query('COMMIT');
        return nuevoMovimiento;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
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