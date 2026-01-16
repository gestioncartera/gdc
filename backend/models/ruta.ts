import db from "../db/db";

export interface Ruta {
  ruta_id?: number;
  sucursal_id: number;
  nombre_ruta: string;
  descripcion?: string;
  zona?: string;
  fecha_creacion?: Date;
  estado?: string;
  created_at?: Date;
}

// Crear una nueva ruta
export async function createRuta(ruta: Ruta): Promise<Ruta|null> {
  const newRuta = await db.query(
    `INSERT INTO rutas (sucursal_id, nombre_ruta, descripcion, zona, fecha_creacion, estado, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING * `,
    [
      ruta.sucursal_id,
      ruta.nombre_ruta,
      ruta.descripcion || null,
      ruta.zona || null,
      ruta.fecha_creacion || new Date().toISOString(),
      ruta.estado || 'activo',
      ruta.created_at || new Date().toISOString()
    ]
  );
  return newRuta.rows[0]||null;
}


// Obtener todas las rutas
export async function getRutas(): Promise<Ruta[]|any[] > {
  const result = await db.query
  (`SELECT 
    r.*,
    COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') AS cobrador
FROM public.rutas r
LEFT JOIN public.asignaciones_rutas ar  ON r.ruta_id = ar.ruta_id AND ar.estado = 'activo'
LEFT JOIN public.usuarios u  ON ar.usuario_id = u.usuario_id
order BY r.ruta_id ASC
    `

  );
  return result.rows;
}

  // Buscar una ruta por ID
export async function getRutaById(id: number): Promise<Ruta | null> {
  const result = await db.query('SELECT * FROM rutas WHERE ruta_id = $1',
    [
      id
    ]);
  return result.rows[0] || null;
}

// Actualizar una ruta
export async function updateRuta(id: number, ruta: Ruta): Promise<Ruta | null> {
  const result = await db.query(
    `UPDATE rutas SET sucursal_id = $1, nombre_ruta = $2, descripcion = $3, zona = $4, fecha_creacion = $5, estado = $6, created_at = $7
     WHERE ruta_id = $8 RETURNING *`,
    [
      ruta.sucursal_id,
      ruta.nombre_ruta,
      ruta.descripcion || null,
      ruta.zona || null,
      ruta.fecha_creacion || new Date().toISOString(),
      ruta.estado || 'activo',
      ruta.created_at || new Date().toISOString(),
      id
    ]
  );
  return result.rows[0] || null;
}

// Eliminar una ruta
export async function deleteRuta(id: number): Promise<Ruta | null> {
  const result = await db.query('DELETE FROM rutas WHERE ruta_id = $1 RETURNING *',
    [
      id
    ]);
  return result.rows[0] || null;
}

export default {
  createRuta,
  getRutas,
  getRutaById,
  updateRuta,
  deleteRuta
};
