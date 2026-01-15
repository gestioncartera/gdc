import  db from "../db/db";

export interface AsignacionRuta {
  asignacion_id?: number;
  ruta_id: number;
  usuario_id: number;
  fecha_asignacion?: Date;
  fecha_fin?: Date;
  estado?: string;
  created_at?: Date;
}

// Crear una nueva asignación de ruta
export const createAsignacionRuta = async (asignacionRuta: AsignacionRuta): Promise<AsignacionRuta | null> => {
  const newAsignacionRuta = await db.query(
    'INSERT INTO asignaciones_rutas (ruta_id, usuario_id, fecha_asignacion, fecha_fin, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [
      asignacionRuta.ruta_id,
      asignacionRuta.usuario_id,
      asignacionRuta.fecha_asignacion || new Date().toISOString().slice(0, 10),
      asignacionRuta.fecha_fin || null,
      asignacionRuta.estado || 'activo'
      //asignacionRuta.created_at || new Date().toISOString().slice(0, 10),
    ]
  );
  
  return newAsignacionRuta.rows[0] || null;
};

// Obtener todas las asignaciones de ruta
export const getAsignacionesRuta = async (): Promise<AsignacionRuta[]> => {
  const result = await db.query('SELECT * FROM asignaciones_rutas');
  return result.rows;
};

// Eliminar asignación de ruta
export const deleteAsignacionRuta = async (id: number): Promise<AsignacionRuta | null> => {
  const deletedAsignacionRuta = await db.query(
    'DELETE FROM asignaciones_rutas WHERE asignacion_id = $1 RETURNING *',
    [id]
  );
  return deletedAsignacionRuta.rows[0] || null;
};

// Actualizar asignación de ruta
export const updateAsignacionRuta = async (id: number, asignacionRuta: AsignacionRuta): Promise<AsignacionRuta | null> => {
  const updatedAsignacionRuta = await db.query(
    'UPDATE asignaciones_rutas SET ruta_id = $1, empleado_id = $2, fecha_asignacion = $3, fecha_fin = $4, estado = $5 WHERE asignacion_id = $6 RETURNING *',
    [
      asignacionRuta.ruta_id,
      asignacionRuta.usuario_id,
      asignacionRuta.fecha_asignacion || new Date(),
      asignacionRuta.fecha_fin || null,
      asignacionRuta.estado || 'activo',
      id
    ]
  );
  return updatedAsignacionRuta.rows[0] || null;
};

//validar si la ruta ya está asignada a un usuario 
export const isRutaAsignada = async (ruta_id: number, usuario_id: number): Promise<boolean> => {
// console.log("entro a models",ruta_id,usuario_id);
  const result = await db.query(
    'SELECT * FROM asignaciones_rutas WHERE ruta_id = $1 AND usuario_id = $2 AND estado = $3',
    [ruta_id, usuario_id, 'activo']
  );


  return result.rows.length > 0;
};

//desactivar una asignación de ruta
export const desactivarAsignacionRuta = async (idUsuario: number,idRuta:number): Promise<AsignacionRuta | null> => {
  const desactivatedAsignacionRuta = await db.query(
    'UPDATE asignaciones_rutas SET estado = $1, fecha_fin=$4 WHERE usuario_id = $2 or ruta_id = $3 RETURNING *',
    ['inactivo', 
      idUsuario,
      idRuta, 
      new Date().toISOString().slice(0, 10)]
  );
  //console.log(desactivatedAsignacionRuta);
  return desactivatedAsignacionRuta.rows[0] || null;
};

export default {
  createAsignacionRuta,
  getAsignacionesRuta,
  deleteAsignacionRuta,
  updateAsignacionRuta,
  isRutaAsignada,
  desactivarAsignacionRuta
};