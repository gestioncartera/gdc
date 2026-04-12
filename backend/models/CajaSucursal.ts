import db from "../db/db";

export interface CajaSucursal {
  caja_sucursal_id?: number;
  sucursal_id: number;
  saldo_actual: number;
  fecha_ultima_actualizacion?: Date;
}

// Crear una nueva caja de sucursal
export const createCajaSucursal = async (caja: CajaSucursal): Promise<CajaSucursal | null> => {
  const result = await db.query(
    `INSERT INTO cajas_sucursales (
    sucursal_id, 
    saldo_actual, 
    fecha_ultima_actualizacion
    ) VALUES ($1, $2, $3) RETURNING *`,   
    [
    caja.sucursal_id, 
    caja.saldo_actual, 
    caja.fecha_ultima_actualizacion || new Date().toLocaleString('en-CA', { 
    timeZone: 'America/Mexico_City', 
    hour12: false 
}).replace(',', '')
]
  );
  return result.rows[0];
};

// Obtener la caja de una sucursal por ID
export const getCajaSucursalBySucursalId = async (sucursal_id: number): Promise<CajaSucursal | null> => {
  
  const result = await db.query(`SELECT * FROM cajas_sucursales WHERE sucursal_id = $1`, 
    [sucursal_id]);
  return result.rows[0] || null;
};

export const getCajaSucursalById = async (caja_sucursal_id: number): Promise<CajaSucursal | null> => {
  const result = await db.query(`SELECT * FROM cajas_sucursales WHERE caja_sucursal_id = $1`,
    [caja_sucursal_id]);
  return result.rows[0] || null;
};

export const cajaInicialSucursal = async (sucursal_id: number): Promise<CajaSucursal | null> => {

  const result = await db.query(
    `select sum(monto) as saldo_inicial from  cajas_sucursales
    inner join movimientos_caja_sucursal as  ms  on cajas_sucursales.caja_sucursal_id = ms.caja_sucursal_id
    where cajas_sucursales.sucursal_id = $1 
    and ms.tipo_movimiento = 'ingreso' 
    and ms.estado_movto = 'confirmado'
    and UPPER(ms.descripcion) like '%APORTE%'`,
    [
    sucursal_id
]
  );
  return result.rows[0];
};

export const getGastosSucursal = async (sucursal_id: number): Promise<number> => {


  const result = await db.query(
    ` select sum(ms.monto) as gastos 
    from  cajas_sucursales
    inner join movimientos_caja_sucursal as  ms  on cajas_sucursales.caja_sucursal_id = ms.caja_sucursal_id
    where cajas_sucursales.sucursal_id = $1
    and ms.tipo_movimiento = 'egreso'
    and ms.estado_movto = 'confirmado'    
    and (ms.descripcion not like '%caja diaria%' and ms.descripcion not like 'Desembolso Pr%' and ms.descripcion not like 'Reembolso%')`,
    [
    sucursal_id
]
  );
 
  
  return result.rows[0].gastos || 0;
};

export const getSumPrestamosSucursal = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    `
    select sum(ms.monto) as total_prestamos 
    from cajas_sucursales
    inner join movimientos_caja_sucursal as  ms  on cajas_sucursales.caja_sucursal_id = ms.caja_sucursal_id
    where cajas_sucursales.sucursal_id = $1
    and ms.tipo_movimiento = 'egreso'
    and ms.estado_movto = 'confirmado'  
    and ms.descripcion like 'Desembolso Pr%'`,
    [sucursal_id]
  );
  return result.rows[0].total_prestamos || 0;
};

export const getSumReembolsosSucursal = async (sucursal_id: number): Promise<number> => {
  const result = await db.query(
    ` select sum(ms.monto) as total_reembolsos 
    from cajas_sucursales
    inner join movimientos_caja_sucursal as  ms  on cajas_sucursales.caja_sucursal_id = ms.caja_sucursal_id 
    where cajas_sucursales.sucursal_id = $1
    and ms.tipo_movimiento = 'ingreso'
    and ms.estado_movto = 'confirmado'
    and ms.descripcion like 'Reembolso a socios%'`,
    [sucursal_id]
  );
  return result.rows[0].total_reembolsos || 0;
};

export const getReporteGastosSucursal = async (sucursal_id: number): Promise<any> => {
  const result = await db.query(
    ` SELECT 
      SUM(CASE 
        WHEN ms.tipo_movimiento = 'egreso' 
             AND ms.descripcion NOT LIKE '%caja diaria%' 
             AND ms.descripcion NOT LIKE 'Desembolso Pr%' 
             AND ms.descripcion NOT LIKE 'Reembolso%' 
        THEN ms.monto ELSE 0 END) AS gastos,

      SUM(CASE 
        WHEN ms.tipo_movimiento = 'egreso' 
             AND ms.descripcion LIKE 'Desembolso Pr%' 
        THEN ms.monto ELSE 0 END) AS total_prestamos,

      SUM(CASE 
        WHEN ms.tipo_movimiento = 'egreso' 
             AND ms.descripcion LIKE 'Reembolso%' 
        THEN ms.monto ELSE 0 END) AS total_reembolsos

    FROM cajas_sucursales
    INNER JOIN movimientos_caja_sucursal AS ms 
        ON cajas_sucursales.caja_sucursal_id = ms.caja_sucursal_id
    WHERE cajas_sucursales.sucursal_id = $1
      AND ms.estado_movto = 'confirmado'`,
    [sucursal_id]
  );
  return result.rows[0] || { gastos: 0, total_prestamos: 0, total_reembolsos: 0 };
}

export default {
  createCajaSucursal,
  getCajaSucursalBySucursalId,
  getCajaSucursalById,
  getSumPrestamosSucursal,
  cajaInicialSucursal,
  getGastosSucursal,
  getReporteGastosSucursal
};