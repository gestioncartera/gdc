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

//obtener ruta asignada a un usuario
export const getRutaAsignadaUsuario = async (usuario_id: number): Promise<AsignacionRuta | null> => {
  const result = await db.query(
    'SELECT ruta_id FROM asignaciones_rutas WHERE usuario_id = $1 AND estado = $2',
    [usuario_id, 'activo']
  );
  return result.rows[0] || null;
};

//obtener el usuario asignado a una ruta
export const getUsuarioAsignadoRuta = async (ruta_id: number): Promise<AsignacionRuta | null> => {
  const result = await db.query(
    'SELECT usuario_id FROM asignaciones_rutas WHERE ruta_id = $1 AND estado = $2',
    [ruta_id, 'activo']
  );
  return result.rows[0] || null;
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
    `UPDATE asignaciones_rutas 
     SET estado = $1, fecha_fin = $4 
     WHERE (usuario_id = $2 OR ruta_id = $3) AND estado = 'activo' 
     RETURNING *`,
    ['inactivo', 
      idUsuario,
      idRuta, 
      new Date().toISOString().slice(0, 10)]
  );
  //console.log(desactivatedAsignacionRuta);
  return desactivatedAsignacionRuta.rows[0] || null;
};

// Función óptima: Transacción para limpiar asignaciones previas y crear la nueva
export const asignarRutaSegura = async (asignacionRuta: AsignacionRuta): Promise<AsignacionRuta> => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Desactivar cualquier conflicto activo (Ruta ya asignada a otro O Usuario con otra ruta)
    await client.query(
      `UPDATE asignaciones_rutas 
       SET estado = 'inactivo', fecha_fin = $3 
       WHERE (usuario_id = $1 OR ruta_id = $2) AND estado = 'activo'`,
      [asignacionRuta.usuario_id, asignacionRuta.ruta_id, new Date().toISOString().slice(0, 10)]
    );

    // 2. Crear la nueva asignación
    const newAsignacion = await client.query(
      `INSERT INTO asignaciones_rutas (ruta_id, usuario_id, fecha_asignacion, fecha_fin, estado) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        asignacionRuta.ruta_id,
        asignacionRuta.usuario_id,
        asignacionRuta.fecha_asignacion || new Date().toISOString().slice(0, 10),
        asignacionRuta.fecha_fin || null,
        'activo'
      ]
    );

    await client.query('COMMIT');
    return newAsignacion.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  createAsignacionRuta,
  getAsignacionesRuta,
  getRutaAsignadaUsuario,
  deleteAsignacionRuta,
  updateAsignacionRuta,
  isRutaAsignada,
  desactivarAsignacionRuta,
  asignarRutaSegura,
  getUsuarioAsignadoRuta
};