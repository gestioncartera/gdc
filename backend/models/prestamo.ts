import e from "express";
import db from "../db/db";

export interface Prestamo {
  prestamo_id?: number;
  cliente_id: number;
  periodo_id: number;
  monto_prestamo: number;
  fecha_desembolso?: Date;
  estado_prestamo?: string;
  saldo_pendiente?: number;
  created_at?: Date;
  tipo_prestamo_id: number;
  valor_intereses: number;
  valor_cuota?: number;
  fecha_fin_prestamo?: Date;
}

export const createPrestamo = async (prestamo: Prestamo): Promise<Prestamo| null> => {
  const result = await db.query(
    `INSERT INTO prestamos (cliente_id, 
                            periodo_id, 
                            monto_prestamo, 
                            fecha_desembolso, 
                            estado_prestamo, 
                            saldo_pendiente,
                            created_at, 
                            tipo_prestamo_id, 
                            valor_intereses, 
                            valor_cuota,
                            fecha_fin_prestamo ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      prestamo.cliente_id,
      prestamo.periodo_id,  
      prestamo.monto_prestamo,
      prestamo.fecha_desembolso||new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),// new Date().toISOString().slice(0, 10),
      prestamo.estado_prestamo||'en curso',
      prestamo.saldo_pendiente || prestamo.monto_prestamo,
      prestamo.created_at || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),//new Date().toISOString().slice(0, 10),
      prestamo.tipo_prestamo_id,
      prestamo.valor_intereses,
      prestamo.valor_cuota,
      prestamo.fecha_fin_prestamo
    ]
  );
  return result.rows[0];
};

// Obtener todos los préstamos
export const getAllPrestamos = async (): Promise<Prestamo[]> => {
  const result = await db.query(`SELECT * FROM prestamos`);
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
  (`SELECT prestamos.*
    FROM  prestamos
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
export const updatePrestamo = async (prestamo_id: number, prestamo: Prestamo): Promise<Prestamo | null> => {
  const result = await db.query(
    `UPDATE prestamos SET cliente_id = $1, periodo_id = $2, monto_prestamo = $3, fecha_desembolso = $4, estado_prestamo_id = $5, saldo_pendiente = $6, tipo_prestamo_id = $7 WHERE prestamo_id = $8 RETURNING *`,
    [
      prestamo.cliente_id,
      prestamo.periodo_id,
      prestamo.monto_prestamo,  
      prestamo.fecha_desembolso,
      prestamo.estado_prestamo,
      prestamo.saldo_pendiente,
      prestamo.tipo_prestamo_id,
      prestamo_id,
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
  deletePrestamo
};


