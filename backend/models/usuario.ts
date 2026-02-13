import e from "express";
import db from "../db/db";

export interface Usuario {
  usuario_id?: number;
  sucursal_id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  email: string;
  tipo_usuario: number; // Foreign key to TipoUsuario
  estado?: string; 
  created_at?: Date;
  password: string;
}

//crear usuario
export const createUsuario = async (usuario: Usuario): Promise<Usuario|null> => {
  const newUsuario =
  await db.query(
    'INSERT INTO usuarios (sucursal_id, nombres, apellidos, dni, telefono, email, tipo_usuario, estado, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9 ) RETURNING *',
    [
      usuario.sucursal_id,
      usuario.nombres,
      usuario.apellidos,
      usuario.dni,
      usuario.telefono || null,
      usuario.email || null,
      usuario.tipo_usuario,
      usuario.estado||'activo',
      usuario.password


    ]
  );
  return newUsuario.rows[0] || null;
}

//obtener todos los usuarios
export const getUsuarios = async (idSucursal: number): Promise<Usuario[]> => {
  const result = await db.query( `SELECT * FROM usuarios WHERE sucursal_id = $1`, 
    [idSucursal]); 
  return result.rows;
}

//buscar usuario por ID
export const getUsuarioById = async (id: number): Promise<Usuario | null> => {
  const result = await db.query('SELECT * FROM usuarios WHERE usuario_id = $1',
    [
      id
    ]);
  return result.rows[0] || null;
}
//buscar usuario por DNI
export const getUsuarioByDNI = async (dni: string): Promise<Usuario | null> => {
  const result = await db.query('SELECT * FROM usuarios WHERE dni = $1',
    [ 
      dni
    ]);
  return result.rows[0] || null;
} 

//actualizar usuario
export const updateUsuario = async (id: number, usuario: Partial<Usuario>): Promise<Usuario | null> => {
  const updatedUsuario = await db.query(
    `UPDATE usuarios SET sucursal_id = $1, nombres = $2, apellidos = $3, dni = $4, telefono = $5, email = $6, tipo_usuario = $7, estado = $8 WHERE usuario_id = $9 returning *`,
    [ 
      usuario.sucursal_id,
      usuario.nombres,
      usuario.apellidos,
      usuario.dni,
      usuario.telefono || null,
      usuario.email || null,
      usuario.tipo_usuario,
      usuario.estado || 'activo',
      id
    ]
  );
  return updatedUsuario.rows[0] || null;
}

//actualizar contraseña de usuario
export const updatePassword = async (id: number, newPassword: string): Promise<Usuario | null> => {
  const updatedUsuario = await db.query(
    `UPDATE usuarios SET password = $1 WHERE usuario_id = $2 RETURNING *`,
    [newPassword, id]
  );
  return updatedUsuario.rows[0] || null;
}

//eliminar usuario
export const deleteUsuario = async (id: number): Promise<Usuario | null > => {
  const deletedUsuario = await db.query(
    'DELETE FROM usuarios WHERE usuario_id = $1 RETURNING *',
    [id]
  );
  return deletedUsuario.rows[0] || null;
}

//obtener usuario por correo
export const getUsuarioByEmail = async (email: string): Promise<Usuario | null> => {

  const result = await db.query('SELECT * FROM usuarios WHERE email = $1',
    [
      email
    ]);
    
  return result.rows[0] || null;
}



export default {
  createUsuario,
  getUsuarios,
  getUsuarioById,
  getUsuarioByDNI,
  getUsuarioByEmail,
  updateUsuario,
  updatePassword,
  deleteUsuario
};