import db from "../db/db";

export interface MovimientoCajaSucursal {
    movimiento_id?: number;
    caja_sucursal_id: number;
    usuario_responsable_id: number;
    tipo_movimiento:string
    monto: number;
    descripcion: string;
    fecha_movimiento?: Date;
    estado_movto?: string;
    
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
                fecha_movimiento,
                estado_movto
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
             
            [movimiento.caja_sucursal_id,
            movimiento.usuario_responsable_id,
            movimiento.tipo_movimiento ,
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

// Anular movimiento y revertir saldo automáticamente
export const anularMovimientoCajaSucursal = async (movimiento_id: number): Promise<MovimientoCajaSucursal | null> => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener y bloquear el movimiento para evitar doble anulación
        const resMovimiento = await client.query(
            `SELECT * FROM movimientos_caja_sucursal WHERE movimiento_id = $1 FOR UPDATE`,
            [movimiento_id]
        );

        if (resMovimiento.rowCount === 0) {
            throw new Error('Movimiento no encontrado');
        }

        const movimientoOriginal = resMovimiento.rows[0];

        if (movimientoOriginal.estado_movto === 'anulado') {
             throw new Error('El movimiento ya se encuentra anulado');
        }

        // 2. Calcular el monto a revertir
        // Si fue Ingreso: el saldo subió, hay que restarlo (-monto)
        // Si fue Egreso: el saldo bajó, hay que sumarlo (+monto)
        let montoReversion = 0;
        const tipoQuery = movimientoOriginal.tipo_movimiento.toLowerCase();
        
        if (tipoQuery === 'ingreso') {
            montoReversion = -parseFloat(movimientoOriginal.monto);
        } else if (tipoQuery === 'egreso') {
            montoReversion = parseFloat(movimientoOriginal.monto);
        } else {
             throw new Error(`Tipo de movimiento desconocido: ${tipoQuery}`);
        }

        // 3. Actualizar Saldo de la Caja Sucursal
        await client.query(
            `UPDATE cajas_sucursales 
             SET saldo_actual = saldo_actual + $1,
                 fecha_ultima_actualizacion = NOW()
             WHERE caja_sucursal_id = $2`,
            [montoReversion, movimientoOriginal.caja_sucursal_id]
        );

        // 4. Marcar movimiento como ANULADO
        // Nota: Mantenemos la fecha original del movimiento, pero actualizamos el estado
        const result = await client.query(
            `UPDATE movimientos_caja_sucursal 
             SET estado_movto = 'anulado'
             WHERE movimiento_id = $1 
             RETURNING *`,
            [movimiento_id]
        );

        await client.query('COMMIT');
        return result.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error anulando movimiento:", error);
        throw error;
    } finally {
        client.release();
    }
};

export default {
    createMovimientoCajaSucursal,
    getMovimientosByCajaSucursalId,
    anularMovimientoCajaSucursal
};