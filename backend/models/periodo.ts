import db from '../db/db';

export interface Periodo {
  periodo_id?: number;
  sucursal_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  capital_inicial: number;
  estado?: string;
  created_at?: Date;
}

// Obtener todos los periodos
export async function getPeriodos(): Promise<Periodo[]> {
  const result = await db.query('SELECT * FROM periodos');
  return result.rows;
}   

// Crear un nuevo periodo
export async function createPeriodo(periodo:Periodo): Promise<Periodo|null> {
    //console.log(periodo);
  const newPeriodo = await db.query(    
    `INSERT INTO periodos (sucursal_id, fecha_inicio, fecha_fin, capital_inicial, estado,created_at)
     VALUES ($1, $2, $3, $4, $5,$6) `,
    [           
        periodo.sucursal_id,
        periodo.fecha_inicio,
        periodo.fecha_fin ,
        periodo.capital_inicial,
        periodo.estado || 'en curso',
        periodo.created_at || new Date().toISOString() .slice(0, 10),
    ]
  );
  return newPeriodo.rows[0]||null;
}

// Actualizar un periodo
export async function updatePeriodo(id: number, periodo: Omit<Periodo,'fecha_inicio'>): Promise<Periodo|null> {
  const updatedPeriodo = await db.query(    
    `UPDATE periodos SET fecha_fin=$1, capital_inicial=$2, estado=$3 WHERE periodo_id=$4 `,
    [           
        periodo.fecha_fin || null,
        periodo.capital_inicial,
        periodo.estado,
        id
    ]
  );
  return updatedPeriodo.rows[0]||null;
}

// Buscar un periodo por ID
export async function getPeriodoById(id: number): Promise<Periodo | null> {
  const result = await db.query('SELECT * FROM periodos WHERE periodo_id = $1',
    [
      id
    ]);
  return result.rows[0] || null;
}

// Buscar periodos por sucursal ID
export async function getPeriodosBySucursal(sucursal_id: number): Promise<Periodo[]> {
  const result = await db.query('SELECT * FROM periodos WHERE sucursal_id = $1 ',    
    [
        sucursal_id
    ]);
  return result.rows||null;
}   

// Cerrar un periodo
export async function closePeriodo(id: number): Promise<Periodo|null> {
  const closedPeriodo = await db.query( 
    `UPDATE periodos 
     SET estado='cerrado' 
     WHERE periodo_id=$1 
     AND NOT EXISTS (
        SELECT 1 FROM prestamos 
        WHERE prestamos.periodo_id = periodos.periodo_id 
        AND prestamos.estado_prestamo = 'en curso'
     )
     RETURNING *`,
    [           
        id
    ]
  );
  return closedPeriodo.rows[0] ||null;
}   

// Eliminar un periodo
export async function deletePeriodo(id: number): Promise<Periodo|null> {
    const periodoEliminado=await db.query('DELETE FROM periodos WHERE periodo_id = $1 RETURNING *', 
   [
        id
    ]);
    return periodoEliminado.rows[0]||null;
}

export default {
  getPeriodos,
  createPeriodo,
    updatePeriodo,
    getPeriodoById,
    getPeriodosBySucursal,
    closePeriodo,
    deletePeriodo
};

