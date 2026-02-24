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
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) + $1
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
// Validar Múltiples Cobros (Versión Optimizada)
export async function validarMultiplesCobros(cobroIds: number[]) {
  const client = await db.connect();
  let totalIngreso: number = 0;
  const resultados = {
    procesados: [] as number[],
    errores: [] as { id: number, motivo: string }[]
  };

  try {
    await client.query('BEGIN');

    // 1. Obtener todos los datos necesarios en UNA sola consulta
    // Esto reduce drásticamente el tiempo
    const cobrosQuery = await client.query(
      `SELECT c.cobro_id, c.monto_cobrado, c.prestamo_id, c.estado ,c.usuario_id
       FROM cobros c 
       WHERE c.cobro_id = ANY($1) FOR UPDATE`,
      [cobroIds]
    );
    const cobrador_id= cobrosQuery.rows[0]?.usuario_id; // Asumimos que todos los cobros son del mismo usuario, si no habría que validar eso también
    const cobrosAProcesar = cobrosQuery.rows;

      const resCajaSucursal = await client.query(
                `SELECT cs.caja_sucursal_id as caja_sucursal_id 
                FROM prestamos 
                inner join sucursales s on prestamos.sucursal_id = s.sucursal_id
                inner join cajas_sucursales cs on s.sucursal_id = cs.sucursal_id
                WHERE prestamo_id = ANY($1) 
                group by cs.caja_sucursal_id`,
                [cobrosAProcesar.map(c => c.prestamo_id)]
            );
            if (resCajaSucursal.rows.length !== 1) {
                throw new Error('Error con la sucursal asociada al préstamo');
            }

            const cajaSucursalId = resCajaSucursal.rows[0]?.caja_sucursal_id;



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
              totalIngreso += cobro.monto_cobrado;

            

            resultados.procesados.push(cobro.cobro_id);
            await client.query(`RELEASE SAVEPOINT sp_${cobro.cobro_id}`);

        } catch (err: any) {
            await client.query(`ROLLBACK TO SAVEPOINT sp_${cobro.cobro_id}`);
            resultados.errores.push({ id: cobro.cobro_id, motivo: err.message });
        }
    }

    //sumar registrar el movimiento en caja sucursal y actualizar el saldo de la caja sucursal
            // Obtener caja_sucursal_id asociada al usuario que hizo el cobro
          
            // Registrar el movimiento en caja_sucursal_movimientos
            await client.query(
                `INSERT INTO caja_sucursal_movimientos (
                caja_sucursal_id, 
                tipo_movimiento, 
                monto, 
                fecha_movimiento, 
                descripcion, 
                usuario_id)
                 VALUES (
                 $1, 
                 'ingreso', 
                 $2, 
                 NOW(), 
                 'Cobro de préstamos el dia'+ new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
                 $3)`,
                [cajaSucursalId, totalIngreso, cobrador_id]
            );

            // Actualizar el saldo de la caja sucursal
            await client.query(
                `UPDATE caja_sucursales 
                SET saldo_actual = saldo_actual + $1 
                WHERE caja_sucursal_id = $2`,
                [totalIngreso, cajaSucursalId]
            );

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

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  getCobrosByIds,
  getCobrosByPrestamoId,
  getCobrosByRutaId,
  getCobroInfoById,
  getCobrosPendientesByPrestamoId,
  updateCobro,
  deleteCobro,
  validarCobro,
  validarMultiplesCobros
};
