import e from "express";
import db from "../db/db";

export interface Prestamo {
  prestamo_id?: number;
  cliente_id: number;
  sucursal_id: number;
  monto_prestamo: number;
  fecha_desembolso?: Date;
  estado_prestamo?: string;
  saldo_pendiente?: number;
  created_at?: Date;
  tipo_prestamo_id: number;
  valor_intereses: number;
  valor_cuota?: number;
  fecha_fin_prestamo?: Date;
  id_usuario_creacion: number;
}

// Crear préstamo con validación de caja y registro de egreso (Transacción)
export const createPrestamo = async (prestamo: Prestamo): Promise<Prestamo | null> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar si el usuario tiene Caja Diaria ABIERTA
    const resCaja = await client.query(
      `SELECT caja_diaria_id, monto_final_esperado,ruta_id -- Asumiendo que tienes un campo saldo_final_esperado o similar calculado
       FROM cajas_diarias 
       WHERE usuario_id = $1 AND estado = 'abierta' 
       FOR UPDATE`, // Bloqueamos la fila para evitar concurrencia
      [prestamo.id_usuario_creacion]
    );

    if (resCaja.rowCount === 0) {
      throw new Error('El usuario no tiene una caja diaria abierta para realizar desembolsos.');
    }

    const cajaDiaria = resCaja.rows[0];
    
    // *OPCIONAL*: Validar saldo suficiente en caja diaria (si manejas saldo en tiempo real)
    if (cajaDiaria.monto_final_esperado < prestamo.monto_prestamo) {
       throw new Error('Saldo insuficiente en caja diaria para desembolsar este préstamo.');
     }

    // 2. Insertar el PRÉSTAMO
    const resPrestamo = await client.query(
      `INSERT INTO prestamos (
          cliente_id, sucursal_id, monto_prestamo, fecha_desembolso, 
          estado_prestamo, saldo_pendiente, created_at, tipo_prestamo_id, 
          valor_intereses, valor_cuota, fecha_fin_prestamo, id_usuario_creacion
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        prestamo.cliente_id,
        prestamo.sucursal_id,
        prestamo.monto_prestamo,
        prestamo.fecha_desembolso || new Date(),
        prestamo.estado_prestamo || 'pendiente',
        prestamo.saldo_pendiente || prestamo.monto_prestamo, // Saldo inicial = Monto prestado
        prestamo.created_at || new Date(),
        prestamo.tipo_prestamo_id,
        prestamo.valor_intereses,
        prestamo.valor_cuota,
        prestamo.fecha_fin_prestamo,
        prestamo.id_usuario_creacion // Usamos el ID del usuario logueado
      ]
    );
    
    const nuevoPrestamo = resPrestamo.rows[0];

    // 3. Registrar el desembolso como EGRESO en la Caja Sucursal (o Caja Diaria según tu modelo)
    // Aquí registramos que salió dinero de la caja del usuario
    await client.query(
      `INSERT INTO egresos_operacion (
          usuario_id, 
          ruta_id, 
          fecha_gasto, 
          concepto, 
          monto, 
          descripcion, 
          estado_egreso
      ) VALUES (
          ($1), 
          ($2), 
          ($3), 
          ($4),
          ($5),
          ($6),
          ($7)
      )`,
      [prestamo.id_usuario_creacion,
        cajaDiaria.ruta_id, 
        new Date(), 
        'Desembolso Préstamo #' + nuevoPrestamo.prestamo_id,
         prestamo.monto_prestamo, 
         'Se realizo prestamo',
         'pendiente'
        ]
    );

    await client.query(
      `UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado  - $1
       WHERE caja_diaria_id = $2 AND estado = 'abierta'`,
      [prestamo.monto_prestamo, cajaDiaria.caja_diaria_id]
    );

   

    await client.query('COMMIT');
    return nuevoPrestamo;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

//crear prestamos para usuario administrador sin validar caja diaria ni registrar egreso
export const createPrestamoAdmin = async (prestamo: Prestamo): Promise<Prestamo | null> => {
const client = await db.connect();
  try {
    await client.query('BEGIN');

    const cajaSurcursal = await client.query(
      `SELECT * 
       FROM cajas_sucursales
        WHERE sucursal_id = $1
        FOR UPDATE`, // Bloqueamos la fila para evitar concurrencia
      [prestamo.sucursal_id]
    );

    if (cajaSurcursal.rows.length === 0) {
      throw new Error('No se encontró una caja  para la sucursal.');
    }

    if(cajaSurcursal.rows[0].saldo_actual < prestamo.monto_prestamo){
      throw new Error('Saldo insuficiente en caja para realizar este préstamo.');
    }

    const UpdateCaja = await client.query(
      `UPDATE cajas_sucursales
       SET saldo_actual = saldo_actual - $1
       WHERE caja_sucursal_id = $2`,
      [prestamo.monto_prestamo, cajaSurcursal.rows[0].caja_sucursal_id]
    );

    if(UpdateCaja.rowCount === 0){
      throw new Error('Error al actualizar saldo en caja sucursal.');
    }

  const movtoCaja = await client.query(
    `INSERT INTO movimientos_caja_sucursal (
      sucursal_id,
      tipo_movimiento,
      monto,
      descripcion,
      usuario_responsable_id,
      estado_movto,
      fecha_movimiento
      ) VALUES (
          ($1),
          ($2),
          ($3),
          ($4),
          ($5),
          ($6),
          ($7)
      ) RETURNING *`,
      [prestamo.sucursal_id,
        'egreso',
        prestamo.monto_prestamo,
        'Desembolso Préstamo por administrador',
         prestamo.id_usuario_creacion,
         'confirmado',
          new Date()
        ]
    );

    if(movtoCaja.rows.length === 0){
      throw new Error('Error al registrar movimiento en caja sucursal.');
    }


  const result = await db.query(
    `INSERT INTO prestamos (
        cliente_id, sucursal_id, monto_prestamo, fecha_desembolso,
        estado_prestamo, saldo_pendiente, created_at, tipo_prestamo_id,
        valor_intereses, valor_cuota, fecha_fin_prestamo, id_usuario_creacion
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
    [
      prestamo.cliente_id,
      prestamo.sucursal_id,
      prestamo.monto_prestamo,
      prestamo.fecha_desembolso || new Date(),
      prestamo.estado_prestamo || 'en curso',
      prestamo.saldo_pendiente || prestamo.monto_prestamo,
      prestamo.created_at || new Date(),
      prestamo.tipo_prestamo_id,
      prestamo.valor_intereses,
      prestamo.valor_cuota,
      prestamo.fecha_fin_prestamo,
      prestamo.id_usuario_creacion
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Error al crear el préstamo.');
  }

   await client.query('COMMIT');
  return result.rows[0] || null;

   } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

//confirmar prestamo
export const confirmarPrestamo = async (prestamo_id: number): Promise<Prestamo | null> => {
  const result = await db.query(
    `UPDATE prestamos
     SET estado_prestamo = 'en curso'
     WHERE prestamo_id = $1 RETURNING *`,
    [prestamo_id]
  );
  return result.rows[0] || null;
};

//rechazar prestamo
export const rechazarPrestamo = async (prestamo_id: number): Promise<Prestamo | null> => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // 1. Actualizar el estado del préstamo a 'rechazado'
    const resPrestamo = await client.query(
      `UPDATE prestamos
        SET estado_prestamo = 'rechazado'
        WHERE prestamo_id = $1 RETURNING *`,
      [prestamo_id]
    );
    if (resPrestamo.rows.length === 0) {
      throw new Error('Préstamo no encontrado');
    }

    const prestamo = resPrestamo.rows[0];

    // 2. Obtener la caja diaria abierta del usuario
    const resCaja = await client.query(
      `SELECT * FROM cajas_diarias
       WHERE usuario_id = $1 AND estado = 'abierta'`,
      [prestamo.id_usuario_creacion]
    );

    if (resCaja.rows.length === 0) {
      throw new Error('No hay caja diaria abierta para este usuario');
    }

    const cajaDiaria = resCaja.rows[0];
    
    // 3. cambiar estado  del egreso 
    const egreso=await client.query(
      `UPDATE egresos_operacion
       SET estado_egreso = 'rechazado'
       WHERE usuario_id = $1 AND concepto = 'Desembolso Préstamo #' || $2 returning *`,
      [prestamo.id_usuario_creacion, prestamo_id]
    );

    if(egreso.rows.length === 0){
      throw new Error('Error al actualizar el estado del egreso.');
    }

    // 4. Actualizar el saldo de la caja diaria
    await client.query(
      `UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado + $1
       WHERE caja_diaria_id = $2`,
      [prestamo.monto_prestamo, cajaDiaria.caja_id]
    );

    await client.query('COMMIT');
    return prestamo;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Obtener todos los préstamos
export const getAllPrestamos = async (): Promise<Prestamo[]> => {
  const result = await db.query(`SELECT * FROM prestamos order by prestamo_id asc`);
  return result.rows;
};

//obtener prestamos pendientes de una sucursal
export const PrestamosPendientes = async (sucursal_id: number): Promise<Prestamo[]> => {
  const result = await db.query(
    `SELECT p.*, clientes.nombres||' '||clientes.apellidos AS cliente ,
    tipo_prestamo.porcentaje as tasa_interes,
    usuarios.nombres||' '||usuarios.apellidos AS nombre_cobrador
    FROM prestamos p 
    inner join clientes on p.cliente_id=clientes.cliente_id
    inner join tipo_prestamo on p.tipo_prestamo_id=tipo_prestamo.id_tipo_prestamo
    inner join usuarios on p.id_usuario_creacion=usuarios.usuario_id
     WHERE p.sucursal_id = $1 AND p.estado_prestamo = 'pendiente' 
     ORDER BY prestamo_id ASC`,
    [sucursal_id]
  );
  return result.rows;
}


// Obtener un préstamo por ID
export const getPrestamoById = async (prestamo_id: number): Promise<Prestamo | any> => {
  const result = await db.query
  (`SELECT prestamos.prestamo_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
    prestamos.saldo_pendiente,
    prestamos.valor_cuota,
    prestamos.fecha_fin_prestamo,
      rutas.nombre_ruta
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    inner join rutas on clientes.id_ruta=rutas.ruta_id
    WHERE prestamo_id = $1`, 
  [prestamo_id]);
  return result.rows[0] || null;
};

//Obtener toda informacion de prestamo por id
export const getPrestamoInfoById = async (prestamo_id: number): Promise<Prestamo | any> => {
  const result = await db.query
  (`SELECT clientes.nombres||' '||clientes.apellidos AS cliente ,prestamos.*
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    WHERE prestamo_id = $1`, 
  [prestamo_id]);
  return result.rows[0] || null;
};

//obtener prestamos por cliente
export const getPrestamosByClienteId = async (cliente_id: number): Promise<Prestamo[]|any[]> => {
  const result = await db.query
  (`SELECT  prestamos.prestamo_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
    prestamos.saldo_pendiente,
    prestamos.valor_cuota,
    prestamos.fecha_fin_prestamo
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    WHERE clientes.cliente_id = $1 and prestamos.estado_prestamo='en curso'`, 
    [cliente_id]
  );
  return result.rows;
};

//Obtener el Cobrador responsable de un préstamo y sus cobros

export const getCobradorByPrestamoId = async (prestamo_id: number): Promise<any> => {
  const result = await db.query
  (`SELECT
    ar.usuario_id  
    FROM prestamos
    inner join clientes ON prestamos.cliente_id = clientes.cliente_id
    INNER JOIN asignaciones_rutas ar ON clientes.id_ruta = ar.ruta_id
    WHERE prestamos.prestamo_id = $1 AND ar.estado = 'activo'`,
    [prestamo_id]
  );
  return result.rows[0] || null;
};

//obtener el total de cartera de una sucursal
export const getTotalCarteraSucursal = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    `SELECT SUM(prestamos.saldo_pendiente) AS total_cartera
    FROM prestamos
    WHERE prestamos.sucursal_id = $1`,
    [sucursal_id]
  );
  return result.rows[0].total_cartera || 0;
};

//Obtener la cantidad de prestamos en curso de una sucursal
export const getPrestamosEnCursoSucursal = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    `SELECT COUNT(*) AS prestamos_en_curso
    FROM prestamos
    WHERE prestamos.sucursal_id = $1 AND prestamos.estado_prestamo = 'en curso'`,
    [sucursal_id]
  );
  return result.rows[0].prestamos_en_curso || 0;
};

//Obtener prestamos con informacion
export const getPrestamosInfo = async (): Promise<Prestamo[]|any[]> => {
  const result = await db.query
  (`SELECT  clientes.cliente_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
     prestamos.*
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    order by prestamos.prestamo_id asc`,
  );
  return result.rows;
};

// Actualizar un préstamo
export const updatePrestamo = async (prestamo_id: number,prestamo:Prestamo): Promise<Prestamo | null> => {
  const result = await db.query(
    `UPDATE prestamos SET  monto_prestamo = $2, 
    tipo_prestamo_id = $3,
    valor_intereses = $4, 
    valor_cuota = $5,
    fecha_desembolso = $6, 
    saldo_pendiente = $7, 
    fecha_fin_prestamo = $8 
    WHERE prestamo_id = $1 RETURNING *`,
    [
      
      prestamo_id,
      prestamo.monto_prestamo,
      prestamo.tipo_prestamo_id,
      prestamo.valor_intereses,
      prestamo.valor_cuota,
      prestamo.fecha_desembolso,
      prestamo.saldo_pendiente,
      prestamo.fecha_fin_prestamo
    ]
  );
  return result.rows[0] || null;
};

// Eliminar un préstamo
export const deletePrestamo = async (prestamo_id: number): Promise<Prestamo | null> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

  const result = await db.query(`DELETE FROM prestamos 
    WHERE prestamo_id = $1  and estado_prestamo = 'pendiente' RETURNING *`, 
    [prestamo_id]);

    const updateCaja = await client.query(
      `UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado + $1
        WHERE  usuario_id = $2
           AND estado = 'abierta'`, 
           [result.rows[0].monto_prestamo,
            result.rows[0].id_usuario_creacion
      ]
    );

    const deleteEgreso = await client.query(
      `DELETE FROM egresos_operacion 
       WHERE concepto = $1 AND usuario_id = $2 and estado_egreso = 'pendiente'`,
       ['Desembolso Préstamo #' + prestamo_id, result.rows[0].id_usuario_creacion]
    );


   await client.query('COMMIT');
      return result.rows[0] || null;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};  

//buscar prestamo por id prestamo
export const buscarPrestamoById = async (prestamo_id: number): Promise<Prestamo | null> => {
  const result = await db.query(`SELECT * FROM prestamos 
    WHERE prestamo_id = $1 and estado_prestamo = 'en curso'`, 
    [prestamo_id]);
  return result.rows[0] || null;
};

//Obtener el capital prestado por una sucursal
export const getCapitalEnCalle = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    `SELECT SUM(saldo_pendiente) AS capital_en_calle
     FROM prestamos
     WHERE sucursal_id = $1 AND estado_prestamo = 'en curso'`,
    [sucursal_id]
  );
  return result.rows[0].capital_en_calle || 0;
};

//Obtener los interes proyectados por una sucursal
export const getInteresesProyectados = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    `
    SELECT 
   sucursal,
    SUM(intereses_proyectados) AS intereses_proyectados_totales
from 
(SELECT 
    p.sucursal_id as sucursal,
    p.prestamo_id,    
    case when tp.cantidad_cuotas>COUNT(c.cobro_id) then
    (tp.cantidad_cuotas - COUNT(c.cobro_id)) * (p.valor_intereses / tp.cantidad_cuotas) 
    else
    0
    end  AS intereses_proyectados    
FROM prestamos p
INNER JOIN tipo_prestamo tp ON tp.id_tipo_prestamo = p.tipo_prestamo_id
LEFT JOIN cobros c ON c.prestamo_id = p.prestamo_id
WHERE p.sucursal_id = $1 
  AND p.estado_prestamo = 'en curso'
GROUP BY 
    p.prestamo_id, 
    p.monto_prestamo, 
    p.saldo_pendiente, 
    p.valor_intereses,
    tp.porcentaje, 
    tp.cantidad_cuotas

) as tb_intereses
GROUP BY tb_intereses.sucursal
    `,
    [sucursal_id]
  );
  return result.rows[0].intereses_proyectados_totales || 0;
};

//Desglose de prestamos
export const getDesglosePrestamos = async (sucursal_id:number): Promise<Prestamo[]> => {
  const result = await db.query(`
    SELECT
      p.prestamo_id,
      p.monto_prestamo,   
      p.saldo_pendiente,      
      p.estado_prestamo,
      p.sucursal_id,      
      c.nombres  ||' '||
      c.apellidos AS  nombre     
      FROM prestamos p
      INNER JOIN clientes c ON p.cliente_id = c.cliente_id
      where p.sucursal_id = $1 and p.estado_prestamo = 'en curso'
      ORDER BY c.cliente_id ,p.prestamo_id asc
    `,
    [sucursal_id]
  );
  return result.rows;
};

 export default{
  createPrestamo,
  getAllPrestamos,
  getPrestamoById,
  getPrestamosByClienteId,
  getCobradorByPrestamoId,
  getPrestamosInfo,
  getPrestamoInfoById,
  getTotalCarteraSucursal,
  getPrestamosEnCursoSucursal,
  getCapitalEnCalle,
  getInteresesProyectados,
  getDesglosePrestamos,
  updatePrestamo,
  confirmarPrestamo,
  deletePrestamo,
  rechazarPrestamo,
  PrestamosPendientes,
  createPrestamoAdmin,
  buscarPrestamoById
};


