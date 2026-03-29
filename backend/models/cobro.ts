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

// Crear cobro y actualizar caja diaria (Transacción)
export const createCobro = async (cobro: Cobro): Promise<Cobro | null> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar Caja Diaria ABIERTA del usuario
    const resCaja = await client.query(
      `SELECT caja_diaria_id FROM cajas_diarias 
       WHERE usuario_id = $1 AND estado = 'abierta' FOR UPDATE`,
      [cobro.usuario_id]
    );

    if (resCaja.rowCount === 0) {
      throw new Error('No tienes una caja diaria abierta para registrar cobros.');
    }
    const cajaId = resCaja.rows[0].caja_diaria_id;

    // 2. Insertar el Cobro
    const resCobro = await client.query(
      `INSERT INTO cobros (prestamo_id, usuario_id, fecha_cobro, monto_cobrado, estado) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        cobro.prestamo_id,
        cobro.usuario_id,
        cobro.fecha_cobro || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
        cobro.monto_cobrado,
        cobro.estado || 'pendiente' // Asumo 'confirmado' si ya entra dinero
      ]
    );
    const nuevoCobro = resCobro.rows[0];

    // 3. Actualizar monto_final_esperado en Caja Diaria
    // Se usa COALESCE para tratar nulos como 0 si es la primera suma
    await client.query(
      `UPDATE cajas_diarias 
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) + $1,
       monto_recaudo = COALESCE(monto_recaudo, 0) + $1
       WHERE caja_diaria_id = $2`,
      [cobro.monto_cobrado, 
        cajaId]
    );


    await client.query('COMMIT');
    return nuevoCobro;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Obtener todos los cobros
export const getAllCobros = async (): Promise<Cobro[]|null> => {
  const result = await db.query(`SELECT * FROM cobros order by cobro_id asc`);
  return result.rows || null;
};

// Obtener un cobro por ID
export const getCobroById = async (cobro_id: number): Promise<Cobro | null> => {
  const result = await db.query(`SELECT * FROM cobros WHERE cobro_id = $1`, [cobro_id]);
  return result.rows[0] || null;
};

//Obtener cobros pendientes de un prestamo por ID
export const getCobrosPendientesByPrestamoId = async (prestamo_id: number): Promise<Cobro[]|null> => {
  const result = await db.query(`SELECT * FROM cobros 
    WHERE prestamo_id = $1 
    AND estado='pendiente' 
    order by fecha_cobro asc`
    , 
    [prestamo_id]
  );
  return result.rows || null;
};

// Obtener múltiples cobros por sus IDs
export const getCobrosByIds = async (cobroIds: number[]): Promise<Cobro[]> => {
  if (cobroIds.length === 0) return [];
  
  const result = await db.query(
    `SELECT * FROM cobros WHERE cobro_id = ANY($1)`,
    [cobroIds]
  );
  
  return result.rows;
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
    inner join usuarios u on ar.usuario_id = u.usuario_id
    inner join cobros c on u.usuario_id = c.usuario_id and c.estado='pendiente'
    inner join prestamos p on c.prestamo_id = p.prestamo_id
    inner join clientes cl on p.cliente_id = cl.cliente_id
    WHERE ar.ruta_id = $1  and ar.estado='activo'
    order by cl.cliente_id,c.fecha_cobro desc`,
     [ruta_id]);//and ar.estado='activo'
  return result.rows || null;
};


//obtener cobros por prestamo ID
export const getCobrosByPrestamoId = async (prestamo_id: number): Promise<Cobro[]|any> => {
  const result = await db.query
  (`SELECT 
    c.cobro_id,
    c.fecha_cobro, 
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

//obtener cobros pendientes  por usuario ID
export const getCobrosPendientesByUsuarioId = async (usuario_id: number): Promise<Cobro[]|any> => {
  const result = await db.query
  (`SELECT *
    FROM cobros c
    WHERE c.usuario_id = $1 and c.estado='pendiente'
    order by c.fecha_cobro desc`,
     [usuario_id]);
  return result.rows || null;
};

//Reporte, Obtener los cobros realizados en una sucursal en un dia
export const getTotalCobradoHoy = async (sucursal_id: number, fecha: string): Promise<number> => {
  const result = await db.query
  (`SELECT coalesce(sum(coalesce(c.monto_cobrado, 0)), 0) as total_cobrado
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE u.sucursal_id = $1 and date(c.fecha_cobro) = date($2)`, [sucursal_id, fecha]);

    return result.rows[0].total_cobrado || 0;
};

//REPORTE, obetener la cantidad de prestamos que aun se han realizado el cobro para una sucursal
export const getCantCobrosHoy = async (sucursal_id: number, fecha: string): Promise<number> => {
  const result = await db.query
  (`SELECT COUNT(DISTINCT c.prestamo_id) as cantidad_prestamos
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE u.sucursal_id = $1 and date(c.fecha_cobro) = date($2)`, [sucursal_id, fecha]);

    return result.rows[0].cantidad_prestamos || 0;
};

//Reporte de cobros por cobrador, obtener el total cobrado por un cobrador en un dia
 export const getTotalCobradoByUsuarioId = async (usuario_id: number, fecha: string): Promise<number> => {
  const result = await db.query
  (`SELECT coalesce(sum(coalesce(c.monto_cobrado, 0)), 0) as total_cobrado,
    u.usuario_id
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE c.usuario_id = $1 and date(c.fecha_cobro) = date($2)`, [usuario_id, fecha]);

    return result.rows[0].total_cobrado || 0;
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

// Actualizar monto de cobro y sincronizar caja diaria (Transacción)
export const updateMontoCobroConCaja = async (
  cobro_id: number, 
  nuevo_monto: number
): Promise<Cobro | null> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el cobro actual para saber el monto anterior
    const resCobroActual = await client.query(
      `SELECT c.*, cd.caja_diaria_id, cd.monto_final_esperado
       FROM cobros c
       INNER JOIN cajas_diarias cd ON c.usuario_id = cd.usuario_id AND cd.estado = 'abierta'
       WHERE c.cobro_id = $1
       FOR UPDATE OF cd`,
      [cobro_id]
    );

    if (resCobroActual.rowCount === 0) {
      throw new Error('Cobro no encontrado o no tiene caja diaria abierta.');
    }

    const cobroActual = resCobroActual.rows[0];
    const montoAnterior = parseFloat(cobroActual.monto_cobrado);
    const cajaId = cobroActual.caja_diaria_id;
    const diferencia = nuevo_monto - montoAnterior;

    // 2. Actualizar el cobro con el nuevo monto
    const resUpdateCobro = await client.query(
      `UPDATE cobros SET monto_cobrado = $1 WHERE cobro_id = $2 RETURNING *`,
      [nuevo_monto, cobro_id]
    );

    // 3. Actualizar la caja diaria (sumar la diferencia)
    await client.query(
      `UPDATE cajas_diarias 
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) + $1,
        monto_recaudo = COALESCE(monto_recaudo, 0) + $1
       WHERE caja_diaria_id = $2`,
      [diferencia, cajaId]
    );


    await client.query('COMMIT');
    return resUpdateCobro.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

//cambiar estado de un cobro a pagado
export const validarCobro = async(cobro_id:number):Promise<Cobro|null>=>{
  const result = await db.query(
    `UPDATE cobros SET estado = $1 WHERE cobro_id = $2 RETURNING *`,
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
// Validar Múltiples Cobros (Versión Optimizada)
// Validar Múltiples Cobros (Versión Optimizada)
export async function validarMultiplesCobros(cobroIds: number[]) {
  const client = await db.connect();
  const resultados = {
    procesados: [] as number[],
    errores: [] as { id: number, motivo: string }[]
  };
 

  try {
    await client.query('BEGIN');

    // 1. Obtener todos los datos necesarios en UNA sola consulta
    // Esto reduce drásticamente el tiempo
    const cobrosQuery = await client.query(
      `SELECT c.cobro_id, 
      c.monto_cobrado, 
      c.prestamo_id, 
      c.estado ,
      p.estado_prestamo,
      p.sucursal_id,
      c.usuario_id
       FROM cobros c 
       inner join prestamos p on c.prestamo_id = p.prestamo_id
       WHERE c.cobro_id = ANY($1) FOR UPDATE`,
      [cobroIds]
    );

    const cobrosAProcesar = cobrosQuery.rows;

    for (const cobro of cobrosAProcesar) {
        if (cobro.estado === 'confirmado') {
             resultados.errores.push({ id: cobro.cobro_id, motivo: 'Ya estaba confirmado' });
             continue;
        }

        
        try {
            await client.query(`SAVEPOINT sp_${cobro.cobro_id}`);

            // A. Marcar cobro
            await client.query(
                `UPDATE cobros SET estado = 'confirmado' WHERE cobro_id = $1`,
                [cobro.cobro_id]
            );

            // B. Actualizar Préstamo
            await client.query(
                `UPDATE prestamos 
                 SET saldo_pendiente = saldo_pendiente - $1,
                     estado_prestamo = CASE WHEN (saldo_pendiente - $1) <= 0.01 THEN 'pagado' ELSE estado_prestamo END
                 WHERE prestamo_id = $2`,
                [cobro.monto_cobrado, cobro.prestamo_id]
            );

            
            resultados.procesados.push(cobro.cobro_id);
            await client.query(`RELEASE SAVEPOINT sp_${cobro.cobro_id}`);

        } catch (err: any) {
            await client.query(`ROLLBACK TO SAVEPOINT sp_${cobro.cobro_id}`);
            resultados.errores.push({ id: cobro.cobro_id, motivo: err.message });
        }
    }
 
  

    // Identificar cobros que no se encontraron en la BD
    const encontradosIds = cobrosAProcesar.map(c => c.cobro_id);
    const noEncontrados = cobroIds.filter(id => !encontradosIds.includes(id));
    noEncontrados.forEach(id => resultados.errores.push({ id, motivo: 'Cobro no encontrado' }));

    await client.query('COMMIT');
    return resultados;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const resumenCobrosCoradorRuta = async (sucursal_id: number, fecha: string): Promise<any> => {
  const result = await db.query(
    `  SELECT  u.usuario_id,
    u.nombres || ' ' || u.apellidos AS nombre_cobrador,
    r.nombre_ruta AS nombre_ruta,
    COUNT(c.cobro_id) AS total_cobros,
    SUM(c.monto_cobrado) AS total_cobrado,
        p.cant as Total_clientes
    FROM cobros c
    INNER JOIN usuarios u ON c.usuario_id = u.usuario_id
    INNER JOIN asignaciones_rutas ar ON u.usuario_id = ar.usuario_id AND ar.estado = 'activo'
    INNER JOIN rutas r ON ar.ruta_id = r.ruta_id
    inner join
    (SELECT count (prestamo_id) as cant, r.ruta_id as ruta_id from prestamos p
    inner join clientes cl on cl.cliente_id = p.cliente_id
    inner join rutas r on r.ruta_id = cl.id_ruta
     where p.estado_prestamo = 'en curso' and p.sucursal_id = $1
     GROUP BY r.ruta_id) as
     p on r.ruta_id = p.ruta_id
    WHERE u.sucursal_id = $1 AND DATE(c.fecha_cobro) = DATE($2)
    GROUP BY u.usuario_id, r.ruta_id, p.cant`,
    [sucursal_id, fecha]
  );
  return result.rows;
};

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  getCobrosByIds,
  getCobrosByPrestamoId,
  getCobrosByRutaId,
  getCobroInfoById,
  getCobrosPendientesByPrestamoId,
  getCobrosPendientesByUsuarioId,
  getTotalCobradoHoy,
  getCantCobrosHoy,
  updateMontoCobroConCaja,
  updateCobro,
  deleteCobro,
  validarCobro,
  validarMultiplesCobros,
  resumenCobrosCoradorRuta
};
