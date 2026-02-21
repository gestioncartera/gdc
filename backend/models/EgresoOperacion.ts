import  db   from "../db/db";

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

export default {
  createEgresoOperacion,
  getAllEgresosOperacionPendientes,
  deleteEgresoOperacion,
  updateEgresoOperacion,
};
