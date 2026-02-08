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

// Crear una nueva sucursal
export async function createSucursal(sucursal: Sucursal): Promise<Sucursal> {
  const newSucursal=await db.query(
    `INSERT INTO sucursales (nombre, direccion, telefono, fecha_creacion, estado)
     VALUES ($1, $2, $3, $4, $5)  RETURNING *`,
    [
      sucursal.nombre,
      sucursal.direccion,
      sucursal.telefono || null,
      sucursal.fecha_creacion || new Date().toISOString().slice(0, 10),
      sucursal.estado || 'activo'
    ]
  );
  
  return newSucursal.rows[0] ;
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