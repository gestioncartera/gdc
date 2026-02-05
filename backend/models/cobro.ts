import db from "../db/db";
import { Pool } from 'pg'; // Asumiendo que usas pg

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

//obtener la informacion del cobro por ID
export const getCobroInfoById = async (cobro_id: number): Promise<Cobro | any> => {
  const result = await db.query(`select c.cobro_id,
      p.prestamo_id,
      cl.cliente_id,
      u.usuario_id,
      c.fecha_cobro,
      c.monto_cobrado,
      c.estado
FROM  usuarios u 
    inner join cobros c on u.usuario_id = c.usuario_id and c.cobro_id=$1
    inner join prestamos p on c.prestamo_id = p.prestamo_id
    inner join clientes cl on p.cliente_id = cl.cliente_id`,
     [cobro_id]
    );
    
  return result.rows[0] || null;
};

//obtener cobros por ruta ID
export const getCobrosByRutaId = async (ruta_id: number): Promise<Cobro[]|any> => {
  const result = await db.query
  (`SELECT c.cobro_id,
    p.prestamo_id,
    cl.nombres ||' '|| cl.apellidos AS cliente_nombre,
   u.usuario_id,
   c.fecha_cobro,
    c.monto_cobrado,
    c.estado
    FROM asignaciones_rutas ar
    left join usuarios u on ar.usuario_id = u.usuario_id
    inner join cobros c on u.usuario_id = c.usuario_id and c.estado='pendiente'
    inner join prestamos p on c.prestamo_id = p.prestamo_id
    inner join clientes cl on p.cliente_id = cl.cliente_id
    WHERE ar.ruta_id = $1 
    order by cl.cliente_id,c.fecha_cobro desc`,
     [ruta_id]);//and ar.estado='activo'
  return result.rows || null;
};


//obtener cobros por prestamo ID
export const getCobrosByPrestamoId = async (prestamo_id: number): Promise<Cobro[]|any> => {
  const result = await db.query
  (`SELECT c.fecha_cobro, 
    sum(c.monto_cobrado) as monto_cobrado, 
    c.estado,
    p.fecha_desembolso,
    p.fecha_fin_prestamo
    FROM cobros c
    inner join prestamos p on c.prestamo_id=p.prestamo_id
    WHERE p.prestamo_id = $1
    group by p.prestamo_id,c.fecha_cobro, c.estado, p.fecha_desembolso, p.fecha_fin_prestamo
    order by c.fecha_cobro desc`,
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

//cambiar estado de un cobro a pagado
export const validarCobro = async(cobro_id:number):Promise<Cobro|null>=>{
  const result = await db.query(
    `UPDATE cobros SET estado = $1 WHERE cobro_id = $1 RETURNING *`,
    [
      'confirmado',
      cobro_id
    ]
  );
  return result.rows[0] || null;
};

// Eliminar un cobro
export const deleteCobro = async (cobro_id: number): Promise<Cobro | null> => {
  const result = await db.query(`DELETE FROM cobros WHERE cobro_id = $1 RETURNING *`, [cobro_id]);
  return result.rows[0] || null;
};




// Validar un cobro y actualizar el saldo del préstamo asociado


export async function validarMultiplesCobros(cobroIds: number[]) {
  const client = await db.connect(); 
  const resultados = {
    procesados: [] as number[],
    errores: [] as { id: number, motivo: string }[]
  };

  try {
    await client.query('BEGIN');

    for (const cobroId of cobroIds) {
      try {
        await client.query(`SAVEPOINT sp_${cobroId}`); // Punto de guardado para aislar errores

        // A. Validar Cobro
        const resCobro = await client.query(
          `UPDATE cobros 
           SET estado = 'confirmado' 
           WHERE cobro_id = $1 AND estado != 'confirmado' 
           RETURNING *`,
          [cobroId]
        );

        if (resCobro.rowCount === 0) {
           await client.query(`ROLLBACK TO SAVEPOINT sp_${cobroId}`);
           resultados.errores.push({ id: cobroId, motivo: 'Cobro no existe o ya validado' });
           continue;
        }

        const cobro = resCobro.rows[0];

        // B. Actualizar Préstamo
        await client.query(
          `UPDATE prestamos 
           SET 
             saldo_pendiente = saldo_pendiente - $1,
             estado_prestamo = CASE 
                                 WHEN (saldo_pendiente - $1) <= 0 THEN 'pagado' 
                                 ELSE estado_prestamo 
                               END
           WHERE prestamo_id = $2`,
          [cobro.monto_cobrado, cobro.prestamo_id]
        );
        
        await client.query(`RELEASE SAVEPOINT sp_${cobroId}`); // Confirmar éxito parcial
        resultados.procesados.push(cobroId);

      } catch (err: any) {
        await client.query(`ROLLBACK TO SAVEPOINT sp_${cobroId}`); // Deshacer cambios de ESTE cobro fallido
        resultados.errores.push({ id: cobroId, motivo: err.message });
      }
    }

    await client.query('COMMIT');
    return resultados;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  getCobrosByPrestamoId,
  getCobrosByRutaId,
  getCobroInfoById,
  updateCobro,
  deleteCobro,
  validarCobro,
  validarMultiplesCobros
};
