import db from "../db/db";

export interface CajaDiaria {
  caja_diaria_id?: number;
  usuario_id: number;
  ruta_id: number;
  fecha_apertura: Date | string;
  fecha_cierre?: Date | string;
  monto_base_inicial: number;
  monto_final_esperado?: number;
  monto_final_real?: number;
  diferencia?: number;
  estado: string;
  created_at?: Date | string;
}

// Crear una nueva caja diaria
export const createCajaDiaria = async (caja: CajaDiaria): Promise<CajaDiaria | null> => {
  const result = await db.query(
    `INSERT INTO cajas_diarias (
      usuario_id, 
      ruta_id, 
      fecha_apertura, 
      monto_base_inicial, 
      estado
    ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      caja.usuario_id,
      caja.ruta_id,
      caja.fecha_apertura || new Date().toISOString().slice(0, 10),
      caja.monto_base_inicial,
      caja.estado || 'abierta'
    ]
  );
  return result.rows[0] || null;
}

// Obtener todas las cajas diarias
export const getAllCajasDiarias = async (): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias ORDER BY created_at DESC`);
  return result.rows || null;
}

// Obtener una caja diaria por ID
export const getCajaDiariaById = async (id: number): Promise<CajaDiaria | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
  return result.rows[0] || null;
}

// Obtener cajas por usuario
export const getCajasDiariasByUsuario = async (usuario_id: number): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias WHERE usuario_id = $1 ORDER BY created_at DESC`, [usuario_id]);
  return result.rows || null;
}

// Obtener cajas por ruta
export const getCajasDiariasByRuta = async (ruta_id: number): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias WHERE ruta_id = $1 ORDER BY created_at DESC`, [ruta_id]);
  return result.rows || null;
}

// Actualizar una caja diaria
export const updateCajaDiaria = async (id: number, caja: Partial<CajaDiaria>): Promise<CajaDiaria | null> => {
  const result = await db.query(
    `UPDATE cajas_diarias SET 
      fecha_cierre = COALESCE($1, fecha_cierre),
      monto_final_esperado = COALESCE($2, monto_final_esperado),
      monto_final_real = COALESCE($3, monto_final_real),
      diferencia = COALESCE($4, diferencia),
      estado = COALESCE($5, estado),
      usuario_id = COALESCE($6, usuario_id),
      ruta_id = COALESCE($7, ruta_id),
      monto_base_inicial = COALESCE($8, monto_base_inicial)
    WHERE caja_diaria_id = $9 RETURNING *`,
    [
      caja.fecha_cierre,
      caja.monto_final_esperado,
      caja.monto_final_real,
      caja.diferencia,
      caja.estado,
      caja.usuario_id,
      caja.ruta_id,
      caja.monto_base_inicial,
      id
    ]
  );
  return result.rows[0] || null;
}

// Eliminar una caja diaria
export const deleteCajaDiaria = async (id: number): Promise<void> => {
  await db.query(`DELETE FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
}

export default {
  createCajaDiaria,
  getAllCajasDiarias,
  getCajaDiariaById,
  getCajasDiariasByUsuario,
  getCajasDiariasByRuta,
  updateCajaDiaria,
  deleteCajaDiaria
};
