import db from "../db/db";

export interface CajaSucursal {
  caja_sucursal_id?: number;
  sucursal_id: number;
  saldo_actual: number;
  fecha_ultima_actualizacion?: Date;
}

// Crear una nueva caja de sucursal
export const createCajaSucursal = async (caja: CajaSucursal): Promise<CajaSucursal | null> => {
  const result = await db.query(
    `INSERT INTO cajas_sucursales (
    sucursal_id, 
    saldo_actual, 
    fecha_ultima_actualizacion
    ) VALUES ($1, $2, $3) RETURNING *`,   
    [
    caja.sucursal_id, 
    caja.saldo_actual, 
    caja.fecha_ultima_actualizacion || new Date().toISOString().slice(0, 10)
]
  );
  return result.rows[0];
};

// Obtener la caja de una sucursal por ID
export const getCajaSucursalBySucursalId = async (sucursal_id: number): Promise<CajaSucursal | null> => {
  
  const result = await db.query(`SELECT * FROM cajas_sucursales WHERE sucursal_id = $1`, 
    [sucursal_id]);
  return result.rows[0] || null;
};

export default {
  createCajaSucursal,
  getCajaSucursalBySucursalId,
};