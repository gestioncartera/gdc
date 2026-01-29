import db from "../db/db";

export interface TipoPrestamo {
  id_tipo_prestamo?: number;
  cantidad_cuotas: number;
  porcentaje: number;
  nombre?: string;
}

// Crear un nuevo tipo de préstamo
export const createTipoPrestamo = async (tipoPrestamo: TipoPrestamo): Promise<TipoPrestamo | null> => {
  const newTipoPrestamo = await db.query(
    'INSERT INTO tipo_prestamo (cantidad_cuotas, porcentaje, nombre_tipo) VALUES ($1, $2, $3) RETURNING *',
    [
      tipoPrestamo.cantidad_cuotas,
      tipoPrestamo.porcentaje,
      tipoPrestamo.nombre ||'Prestamo '+ tipoPrestamo.cantidad_cuotas +'cuotas'
    ]
  );
  return newTipoPrestamo.rows[0] || null;
};

// Obtener todos los tipos de préstamo
export const getTiposPrestamo = async (): Promise<TipoPrestamo[]> => {
  const result = await db.query('SELECT * FROM tipo_prestamo');
  return result.rows;
};




// Eliminar tipo de préstamo
export const deleteTipoPrestamo = async (id: number): Promise<TipoPrestamo | null> => {
  const deletedTipoPrestamo = await db.query(
    'DELETE FROM tipo_prestamo WHERE id_tipo_prestamo = $1 RETURNING *',
    [id]
  );
  return deletedTipoPrestamo.rows[0] || null;
};

// Actualizar tipo de préstamo
export const updateTipoPrestamo = async (id: number, tipoPrestamo: TipoPrestamo): Promise<TipoPrestamo | null> => {
  const updatedTipoPrestamo = await db.query(
    'UPDATE tipo_prestamo SET cantidad_cuotas = $1, porcentaje = $2, nombre_tipo = $3 WHERE id_tipo_prestamo = $4 RETURNING *',
    [
      tipoPrestamo.cantidad_cuotas,
      tipoPrestamo.porcentaje,
      tipoPrestamo.nombre,
      id
    ]
  );
  return updatedTipoPrestamo.rows[0] || null;
};

//buscar tipo de prestamo por id
export const getTipoPrestamoById = async (id: number): Promise<TipoPrestamo[]> => {
  const result = await db.query('SELECT * FROM tipo_prestamo WHERE id_tipo_prestamo = $1', [id]);
  return result.rows;
};

export default {
  createTipoPrestamo,
  getTiposPrestamo,
  deleteTipoPrestamo,
  updateTipoPrestamo,
  getTipoPrestamoById
};
