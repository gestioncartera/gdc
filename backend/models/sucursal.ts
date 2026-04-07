import e, { text } from 'express';
import db from '../db/db';

export interface Sucursal {
  sucursal_id?: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  fecha_creacion?: Date;
  estado?: string;
}
//Buscar una sucursal por ID
export async function getSucursalById(id: number): Promise<Sucursal | null> {
  const result = await db.query('SELECT * FROM sucursales WHERE sucursal_id = $1', 
    [
      id
    ]);
  return result.rows[0] || null;
} 

//buscar una sucursal por nombre
export async function getSucursalByName(nombre: string): Promise<Sucursal | null> {
  const result = await db.query('SELECT * FROM sucursales WHERE nombre = $1',     
    [
      nombre
    ]);
  return result.rows[0] || null;
}

// Obtener todas las sucursales
export async function getSucursales(): Promise<Sucursal[]> {
  const result = await db.query('SELECT * FROM sucursales order by sucursal_id asc');
  return result.rows;
}

// Crear una nueva sucursal con transacción (Caja + Ruta)
export async function createSucursal(sucursal: Sucursal): Promise<Sucursal> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Crear Sucursal
    const newSucursalRes = await client.query(
      `INSERT INTO sucursales (nombre, direccion, telefono, fecha_creacion, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        sucursal.nombre,
        sucursal.direccion,
        sucursal.telefono || null,
        sucursal.fecha_creacion || new Date().toISOString().slice(0, 10),
        sucursal.estado || 'activo'
      ]
    );

    const newSucursal = newSucursalRes.rows[0];

    if (!newSucursal) {
      throw new Error('No se pudo crear la sucursal');
    }

    // 2. Crear Caja Inicial
    await client.query(
      `INSERT INTO cajas_sucursales (sucursal_id, saldo_actual, fecha_ultima_actualizacion) 
       VALUES ($1, $2, NOW())`,
      [newSucursal.sucursal_id, 0]
    );

    // 3. Crear Ruta Default
    const nombreRuta = `Ruta General - ${newSucursal.nombre}`;
    await client.query(
      `INSERT INTO rutas (sucursal_id,
       nombre_ruta, 
       descripcion, 
       zona, 
       fecha_creacion,
       estado, 
       created_at)
       VALUES ($1, $2, $3, $4, $5,$6, NOW())`,
      [
        newSucursal.sucursal_id,
        nombreRuta,
        'Ruta General',
        'General',
        new Date().toISOString(),
        'activo'
      ]
    );

    await client.query('COMMIT');
    return newSucursal;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Actualizar una sucursal
export async function updateSucursal(id: number, sucursal: Partial<Sucursal>): Promise<Sucursal|null> {
 const res=await db.query(
    `UPDATE sucursales SET nombre=$1, direccion=$2, telefono=$3, estado=$4 WHERE sucursal_id=$5  RETURNING *`,
    [
      sucursal.nombre,
      sucursal.direccion,
      sucursal.telefono,
      sucursal.estado,
      id
    ]
  );

    return res.rows[0] ||null;
}

// Eliminar una sucursal
export async function deleteSucursal(id: number): Promise<void> {
  await db.query(
    `DELETE FROM sucursales WHERE sucursal_id=$1  RETURNING *`,
    [id]
  );
}

export default {
  getSucursalById,
  getSucursalByName,
  getSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal
};