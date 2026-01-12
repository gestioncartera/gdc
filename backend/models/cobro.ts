import db from "../db/db";

export interface Cobro {
  cobro_id?: number;
  prestamo_id: number;
  usuario_id: number;
  fecha_cobro?: Date;
  monto_cobrado: number;
  estado: string;
  created_at?: Date;
} 

// Crear un nuevo cobro
export const createCobro = async (cobro: Cobro): Promise<Cobro | null> => {
  const result = await db.query(
    `INSERT INTO cobros (prestamo_id, usuario_id, fecha_cobro, monto_cobrado, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      cobro.prestamo_id,
      cobro.usuario_id,
      cobro.fecha_cobro || new Date().toISOString().slice(0, 10),
      cobro.monto_cobrado,
      cobro.estado || 'pendiente',
    ]
  );
  return result.rows[0] || null;
};

// Obtener todos los cobros
export const getAllCobros = async (): Promise<Cobro[]|null> => {
  const result = await db.query(`SELECT * FROM cobros`);
  return result.rows || null;
};

// Obtener un cobro por ID
export const getCobroById = async (cobro_id: number): Promise<Cobro | null> => {
  const result = await db.query(`SELECT * FROM cobros WHERE cobro_id = $1`, [cobro_id]);
  return result.rows[0] || null;
};

//obtener cobros por prestamo ID
export const getCobrosByPrestamoId = async (prestamo_id: number): Promise<Cobro[]|any> => {
  const result = await db.query
  (`SELECT fecha_cobro, 
    monto_cobrado, 
    estado
    FROM cobros 
    WHERE prestamo_id = $1
    order by fecha_cobro asc`,
     [prestamo_id]);
  return result.rows || null;
};

// Actualizar un cobro
export const updateCobro = async (cobro_id: number, cobro: Cobro): Promise<Cobro | null> => {
  const result = await db.query(
    `UPDATE cobros SET prestamo_id = $1, usuario_id = $2, fecha_cobro = $3, monto_cobrado = $4, estado = $5 WHERE cobro_id = $6 RETURNING *`,
    [
      cobro.prestamo_id,
      cobro.usuario_id,
      cobro.fecha_cobro,
      cobro.monto_cobrado,
      cobro.estado,
      cobro_id,
    ]
  );
  return result.rows[0] || null;
};

// Eliminar un cobro
export const deleteCobro = async (cobro_id: number): Promise<Cobro | null> => {
  const result = await db.query(`DELETE FROM cobros WHERE cobro_id = $1 RETURNING *`, [cobro_id]);
  return result.rows[0] || null;
};

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  getCobrosByPrestamoId,
  updateCobro,
  deleteCobro,
};
