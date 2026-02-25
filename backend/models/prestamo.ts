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
    if (cajaDiaria.saldo_final_esperado < prestamo.monto_prestamo) {
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

// Obtener todos los préstamos
export const getAllPrestamos = async (): Promise<Prestamo[]> => {
  const result = await db.query(`SELECT * FROM prestamos order by prestamo_id asc`);
  return result.rows;
};

// Obtener un préstamo por ID
export const getPrestamoById = async (prestamo_id: number): Promise<Prestamo | any> => {
  const result = await db.query
  (`SELECT prestamos.prestamo_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
    prestamos.saldo_pendiente,
    prestamos.valor_cuota,
    prestamos.fecha_fin_prestamo
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
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
    WHERE clientes.cliente_id = $1`, 
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
  const result = await db.query(`DELETE FROM prestamos WHERE prestamo_id = $1 RETURNING *`, [prestamo_id]);
  return result.rows[0] || null;
};  



 export default{
  createPrestamo,
  getAllPrestamos,
  getPrestamoById,
  getPrestamosByClienteId,
  getCobradorByPrestamoId,
  getPrestamosInfo,
  getPrestamoInfoById,
  updatePrestamo,
  confirmarPrestamo,
  deletePrestamo
};


