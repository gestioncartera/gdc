import e from "express";
import  db   from "../db/db";
import ruta from "./ruta";

export interface EgresoOperacion {
  egreso_id?: number;
  usuario_id: number;
  ruta_id: number;
  fecha_gasto?: Date;
  concepto: string;
  monto: number;
  descripcion?: string;
  created_at?: Date;
  estado_egreso?: string;
}

// Crear egreso de operación y actualizar caja diaria (Transacción Segura)
export const createEgresoOperacion = async (egreso: EgresoOperacion): Promise<EgresoOperacion | null> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener y BLOQUEAR la caja diaria
    const resCaja = await client.query(
      `SELECT caja_diaria_id, monto_final_esperado 
       FROM cajas_diarias 
       WHERE usuario_id = $1 AND estado = 'abierta' 
       FOR UPDATE`, 
      [egreso.usuario_id]
    );

    if (resCaja.rowCount === 0) {
      throw new Error('No tienes una caja diaria abierta para registrar egresos.');
    }
    const cajaId = resCaja.rows[0].caja_diaria_id;

     // Validar si hay saldo suficiente
    const saldoActual = resCaja.rows[0].monto_final_esperado || 0;
    if (saldoActual < egreso.monto) {
        throw new Error('Fondos insuficientes en caja diaria para este egreso.');
    }
    

    // 2. Insertar el Egreso
    const resEgreso = await client.query(
      `INSERT INTO egresos_operacion (
          usuario_id, ruta_id, fecha_gasto, concepto, monto, descripcion, estado_egreso
       ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        egreso.usuario_id,
        egreso.ruta_id,
        egreso.fecha_gasto || new Date(),
        egreso.concepto,
        egreso.monto,
        egreso.descripcion || '',
        egreso.estado_egreso || 'pendiente' // O 'confirmado' si ya impacta caja
      ]
    );
    const nuevoEgreso = resEgreso.rows[0];

    // 3. Restar el monto del monto_final_esperado en Caja Diaria
    await client.query(
      `UPDATE cajas_diarias 
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) - $1
       WHERE caja_diaria_id = $2`,
      [egreso.monto, cajaId]
    );

    await client.query('COMMIT');
    return nuevoEgreso;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Obtener todos los egresos de operación pendientes
export const getAllEgresosOperacionPendientes = async (usuario_id: number,ruta_id: number): Promise<EgresoOperacion[]> => {
  const result = await db.query(`SELECT * 
    FROM egresos_operacion 
    WHERE estado_egreso = 'pendiente' AND usuario_id = $1 AND ruta_id = $2`, 
    [usuario_id, 
    ruta_id]);
  return result.rows;
};  

//obtener sumatoria de egresos pendientes
export const getSumEgresosOperacion = async (usuario_id: number,ruta_id: number,fecha_apertura: Date): Promise<number> => {
  const result = await db.query(`SELECT SUM(monto) as total_egresos
    FROM egresos_operacion
    WHERE  usuario_id = $1 AND ruta_id = $2 AND date(fecha_gasto) = date($3) and estado_egreso <> 'rechazado'`,
    [usuario_id,
    ruta_id,
    fecha_apertura]);
  return Number(result.rows[0].total_egresos )|| 0;
};
//
//Obtener egresos confirmados por usuario_id y ruta_id de la jornada
export const getSumEgresosOperacionConfirmados = async (usuario_id: number, ruta_id: number,fecha_apertura: Date): Promise<number> => {
  const result = await db.query(`SELECT SUM(monto) as total_egresos
    FROM egresos_operacion 
    WHERE estado_egreso = 'confirmado' AND usuario_id = $1 AND ruta_id = $2 AND fecha_gasto = $3`,
    [usuario_id, ruta_id, fecha_apertura]);
  return Number(result.rows[0].total_egresos )|| 0;
};

// Obtener egresos pendientes por usuario_id 
export const getEgresosPendientesByUsuarioId = async (usuario_id: number): Promise<EgresoOperacion[]> => {
  const result = await db.query(`SELECT * 
    FROM egresos_operacion
    WHERE estado_egreso = 'pendiente' AND usuario_id = $1`,
    [usuario_id]);
  return result.rows;
}

// Eliminar egreso de operación
export const deleteEgresoOperacion = async (egreso_id: number): Promise<EgresoOperacion | null> => {
  const result = await db.query(
    `DELETE FROM egresos_operacion WHERE egreso_id = $1 RETURNING *`,
    [egreso_id]
  );
  return result.rows[0] || null;
};

// Actualizar egreso de operación
export const updateEgresoOperacion = async (egreso_id: number, egreso: EgresoOperacion): Promise<EgresoOperacion | null> => {
  const result = await db.query(
    `UPDATE egresos_operacion SET usuario_id = $1, ruta_id = $2, fecha_egreso = $3, concepto = $4, monto = $5, descripcion = $6, estado_egreso = $7 WHERE egreso_id = $8 RETURNING *`,
    [
      egreso.usuario_id,
      egreso.ruta_id,
      egreso.fecha_gasto,
      egreso.concepto,
      egreso.monto,
      egreso.descripcion,
      egreso.estado_egreso,
      egreso_id,
    ]
  );
  return result.rows[0] || null;
};

//confirmar egresos de la operación, recibiendo usuario_id y ruta_id. (cambia estado a confirmado y no impacta caja sucursal creando el movimiento)
const confirmarEgresosOperacion = async (usuario_id: number, ruta_id: number): Promise<any[] | null> => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    
    const updateResult = await client.query(
      `WITH updated_egresos AS (
        UPDATE egresos_operacion eo
        SET estado_egreso = 'confirmado'
        WHERE eo.usuario_id = $1 
          AND eo.ruta_id = $2 
          AND eo.estado_egreso = 'pendiente'
        RETURNING 
          eo.monto, 
          eo.concepto,
          (SELECT sucursal_id FROM usuarios WHERE usuario_id = $1) as sucursal_id
      ),
      total_egresos AS (
        SELECT 
          SUM(monto) as total,
          sucursal_id
        FROM updated_egresos
        GROUP BY sucursal_id
      ),
      insert_movimientos AS (
        INSERT INTO movimientos_caja_sucursal (
          usuario_responsable_id, 
          tipo_movimiento, 
          monto, 
          descripcion,
          caja_sucursal_id,
          estado_movto
        )
        SELECT 
          $1,
          'egreso',
          monto,
          COALESCE(concepto, 'Egreso de operación'),
          sucursal_id,
          'confirmado'
        FROM updated_egresos
        RETURNING 1
      )
      UPDATE cajas_sucursales cs
      SET saldo_actual = COALESCE(cs.saldo_actual, 0) - te.total,
      fecha_ultima_actualizacion = NOW()

      FROM total_egresos te
      WHERE cs.sucursal_id = te.sucursal_id
      RETURNING (SELECT json_agg(ue.*) FROM updated_egresos ue) as egresos_actualizados`,
      [usuario_id, ruta_id]
    );

    await client.query('COMMIT');
    
    return updateResult.rows[0]?.egresos_actualizados || null;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  createEgresoOperacion,
  getAllEgresosOperacionPendientes,
  getSumEgresosOperacion,
  getSumEgresosOperacionConfirmados,
  deleteEgresoOperacion,
  updateEgresoOperacion,
  confirmarEgresosOperacion,
  getEgresosPendientesByUsuarioId
};
