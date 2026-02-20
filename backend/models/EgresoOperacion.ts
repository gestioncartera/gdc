import  db   from "../db/db";

export interface EgresoOperacion {
  egreso_id?: number;
  usuario_id: number;
  ruta_id: number;
  fecha_egreso?: Date;
  concepto: string;
  monto: number;
  descripcion?: string;
  created_at?: Date;
  estado_egreso?: string;
}

// Crear egreso de operación
export const createEgresoOperacion = async (egreso: EgresoOperacion): Promise<EgresoOperacion | null> => {
  const result = await db.query(
    `INSERT INTO egresos_operacion (usuario_id, ruta_id, fecha_egreso, concepto, monto, descripcion, estado_egreso) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      egreso.usuario_id,
      egreso.ruta_id,
      egreso.fecha_egreso || new Date(),
      egreso.concepto,
      egreso.monto,
      egreso.descripcion || null,
      egreso.estado_egreso || 'pendiente',
    ]
  );
  return result.rows[0] || null;
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
      egreso.fecha_egreso,
      egreso.concepto,
      egreso.monto,
      egreso.descripcion,
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
