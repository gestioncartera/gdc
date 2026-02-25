import db from "../db/db";

export interface CajaDiaria {
  caja_diaria_id?: number;
  usuario_id: number;
  ruta_id: number;
  fecha_apertura?: Date | string;
  fecha_cierre?: Date | string;
  monto_base_inicial: number;
  monto_final_esperado?: number;
  monto_final_real?: number;
  diferencia?: number;
  estado?:  string;
  created_at?: Date | string;
}

// Crear apertura de caja diaria con transacción (Descuenta de Sucursal + Crea Caja Diaria)
export const abrirCajaDiaria = async (caja: CajaDiaria, sucursal_id: number): Promise<CajaDiaria> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar si la caja de sucursal tiene fondos suficientes
    const resSaldo = await client.query(
      `SELECT saldo_actual FROM cajas_sucursales WHERE sucursal_id = $1 FOR UPDATE`,
      [sucursal_id]
    );

    if (resSaldo.rowCount === 0) {
        throw new Error('Caja de sucursal no encontrada');
    }

    const saldoActual = parseFloat(resSaldo.rows[0].saldo_actual);
    if (saldoActual < caja.monto_base_inicial) {
         throw new Error('Fondos insuficientes en la caja principal de la sucursal');
    }

     //  Registrar también el egreso en 'movimientos_caja_sucursal' para auditoría
    await client.query(
      `INSERT INTO movimientos_caja_sucursal (
        caja_sucursal_id,
        usuario_responsable_id,
        tipo_movimiento,
        monto,
        descripcion,
        fecha_movimiento,
        estado_movto
      ) VALUES (
        (SELECT caja_sucursal_id FROM cajas_sucursales WHERE sucursal_id = $1),
        $2,
        'egreso',
        $3,
        'Apertura de caja diaria',
        NOW(),
        'confirmado'
      )`,
      [sucursal_id, caja.usuario_id, caja.monto_base_inicial]
    );

    // 2. Descontar el monto inicial de la Caja Sucursal
    await client.query(
      `UPDATE cajas_sucursales 
       SET saldo_actual = saldo_actual - $1, 
           fecha_ultima_actualizacion = NOW()
       WHERE sucursal_id = $2`,
      [caja.monto_base_inicial, sucursal_id]
    );

    // 3. Crear el registro en Caja Diaria
    const resCajaDiaria = await client.query(
      `INSERT INTO cajas_diarias (
        usuario_id, 
        ruta_id, 
        fecha_apertura, 
        monto_base_inicial, 
        monto_final_esperado,
        estado,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6,NOW()) RETURNING *`,
      [
        caja.usuario_id,
        caja.ruta_id,
        caja.fecha_apertura || new Date().toISOString(),
        caja.monto_base_inicial,
         caja.monto_base_inicial || 0, // El monto_final_esperado inicia igual al monto_base_inicial
        'abierta'
      ]
    );

    const nuevaCajaDiaria = resCajaDiaria.rows[0];

    await client.query('COMMIT');
    return nuevaCajaDiaria;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Obtener todas las cajas diarias
export const getAllCajasDiarias = async (): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias ORDER BY created_at DESC`);
  return result.rows || null;
}

// Obtener una caja diaria por ID CajaDiaria
export const getCajaDiariaById = async (id: number): Promise<CajaDiaria | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
  return result.rows[0] || null;
}

// Obtener cajas por usuario
export const getCajasDiariasByUsuario = async (usuario_id: number): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias 
    WHERE usuario_id = $1 AND estado = 'abierta'`, 
    [usuario_id]);
  return result.rows || null;
}

//obtener caja abierta de un usuario
export const getCajaDiariaAbiertaByUsuario = async (usuario_id: number,ruta_id: number): Promise<CajaDiaria | null> => {
  const result = await db.query(`SELECT * 
    FROM cajas_diarias 
    WHERE usuario_id = $1 AND ruta_id = $2 AND estado = 'abierta'`, 
    [usuario_id, ruta_id]);
  return result.rows[0] || null;
}

// Obtener cajas por ruta
export const getCajasDiariasByRuta = async (ruta_id: number): Promise<CajaDiaria[] | null> => {
  const result = await db.query(`SELECT * FROM cajas_diarias 
    WHERE ruta_id = $1 and estado = 'abierta'
     ORDER BY created_at DESC`, 
     [ruta_id]);
  return result.rows || null;
}

// Actualizar una caja diaria
export const updateCajaDiaria = async (id: number, caja: Partial<CajaDiaria>): Promise<CajaDiaria | null> => {
  const result = await db.query(
    `UPDATE cajas_diarias SET 
      fecha_cierre = COALESCE($1, fecha_cierre),
      monto_final_esperado = COALESCE($2, monto_final_esperado),
      monto_final_real = COALESCE($3, monto_final_real),
      diferencia = COALESCE($4, diferencia),
      estado = COALESCE($5, estado),
      usuario_id = COALESCE($6, usuario_id),
      ruta_id = COALESCE($7, ruta_id),
      monto_base_inicial = COALESCE($8, monto_base_inicial)
    WHERE caja_diaria_id = $9 RETURNING *`,
    [
      caja.fecha_cierre,
      caja.monto_final_esperado,
      caja.monto_final_real,
      caja.diferencia,
      caja.estado,
      caja.usuario_id,
      caja.ruta_id,
      caja.monto_base_inicial,
      id
    ]
  );
  return result.rows[0] || null;
}
//validar fondos en la caja principal
export const validarFondosCajaPrincipal = async (sucursal_id: number, monto_requerido: number): Promise<boolean> => {
  const result = await db.query(`SELECT saldo_actual 
    FROM cajas_sucursales  WHERE sucursal_id = $1`, [sucursal_id]);
  const saldoActual = result.rows[0]?.saldo_actual || 0;
  return saldoActual >= monto_requerido;
}

//actualizar la base de la caja diaria 
export const updateBase = async (caja_diaria_id: number, nuevoMontoBase: number): Promise<CajaDiaria | null> => {
  const result = await db.query(
    `UPDATE cajas_diarias SET monto_base_inicial = monto_base_inicial + $1 ,
      monto_final_esperado = monto_final_esperado + $1
    WHERE caja_diaria_id = $2 RETURNING *`,
    [nuevoMontoBase, caja_diaria_id]
  );
  return result.rows[0] || null;
}

// Eliminar una caja diaria
export const deleteCajaDiaria = async (id: number): Promise<void> => {
  await db.query(`DELETE FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
}

export default {
  abrirCajaDiaria,
  getAllCajasDiarias,
  getCajaDiariaById,
  getCajasDiariasByUsuario,
  getCajasDiariasByRuta,
  getCajaDiariaAbiertaByUsuario,
  updateCajaDiaria,
  updateBase,
  deleteCajaDiaria,
  validarFondosCajaPrincipal
};
