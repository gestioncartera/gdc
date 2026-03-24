"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCajaDiaria = exports.cerrarCajaDiaria = exports.updateBase = exports.validarFondosCajaPrincipal = exports.updateCajaDiaria = exports.getCajasDiariasByRuta = exports.getCajaDiariaAbiertaByUsuario = exports.getCajasDiariasByUsuario = exports.getCajaDiariaById = exports.getAllCajasDiarias = exports.abrirCajaDiaria = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear apertura de caja diaria con transacción (Descuenta de Sucursal + Crea Caja Diaria)
const abrirCajaDiaria = async (caja, sucursal_id) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Verificar si la caja de sucursal tiene fondos suficientes
        const resSaldo = await client.query(`SELECT saldo_actual FROM cajas_sucursales WHERE sucursal_id = $1 FOR UPDATE`, [sucursal_id]);
        if (resSaldo.rowCount === 0) {
            throw new Error('Caja de sucursal no encontrada');
        }
        const saldoActual = parseFloat(resSaldo.rows[0].saldo_actual);
        if (saldoActual < caja.monto_base_inicial) {
            throw new Error('Fondos insuficientes en la caja principal de la sucursal');
        }
        //  Registrar también el egreso en 'movimientos_caja_sucursal' para auditoría
        await client.query(`INSERT INTO movimientos_caja_sucursal (
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
      )`, [sucursal_id, caja.usuario_id, caja.monto_base_inicial]);
        // 2. Descontar el monto inicial de la Caja Sucursal
        await client.query(`UPDATE cajas_sucursales 
       SET saldo_actual = saldo_actual - $1, 
           fecha_ultima_actualizacion = NOW()
       WHERE sucursal_id = $2`, [caja.monto_base_inicial, sucursal_id]);
        // 3. Crear el registro en Caja Diaria
        const resCajaDiaria = await client.query(`INSERT INTO cajas_diarias (
        usuario_id, 
        ruta_id, 
        fecha_apertura, 
        monto_base_inicial, 
        monto_final_esperado,
        estado,
        created_at,
        monto_recaudo,
        diferencia,
        monto_final_real
      ) VALUES ($1, $2, $3, $4, $5, $6,NOW(),$7,$8,$9) RETURNING *`, [
            caja.usuario_id,
            caja.ruta_id,
            caja.fecha_apertura || new Date().toISOString(),
            caja.monto_base_inicial,
            caja.monto_base_inicial || 0, // El monto_final_esperado inicia igual al monto_base_inicial
            'abierta',
            0, // monto_recaudo inicia en 0
            0, // diferencia inicia en 0
            0 // monto_final_real inicia en 0
        ]);
        const nuevaCajaDiaria = resCajaDiaria.rows[0];
        await client.query('COMMIT');
        return nuevaCajaDiaria;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.abrirCajaDiaria = abrirCajaDiaria;
// Obtener todas las cajas diarias
const getAllCajasDiarias = async () => {
    const result = await db_1.default.query(`SELECT * FROM cajas_diarias ORDER BY created_at DESC`);
    return result.rows || null;
};
exports.getAllCajasDiarias = getAllCajasDiarias;
// Obtener una caja diaria por ID CajaDiaria
const getCajaDiariaById = async (id) => {
    const result = await db_1.default.query(`SELECT * FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
    return result.rows[0] || null;
};
exports.getCajaDiariaById = getCajaDiariaById;
// Obtener cajas por usuario
const getCajasDiariasByUsuario = async (usuario_id) => {
    const result = await db_1.default.query(`SELECT * FROM cajas_diarias 
    WHERE usuario_id = $1 AND estado = 'abierta'`, [usuario_id]);
    return result.rows || null;
};
exports.getCajasDiariasByUsuario = getCajasDiariasByUsuario;
//obtener caja abierta de un usuario
const getCajaDiariaAbiertaByUsuario = async (usuario_id, ruta_id) => {
    const result = await db_1.default.query(`SELECT * 
    FROM cajas_diarias 
    WHERE usuario_id = $1 AND ruta_id = $2 AND estado = 'abierta'`, [usuario_id, ruta_id]);
    return result.rows[0] || null;
};
exports.getCajaDiariaAbiertaByUsuario = getCajaDiariaAbiertaByUsuario;
// Obtener cajas por ruta
const getCajasDiariasByRuta = async (ruta_id) => {
    const result = await db_1.default.query(`SELECT * FROM cajas_diarias 
    WHERE ruta_id = $1 and estado = 'abierta'
     ORDER BY created_at DESC`, [ruta_id]);
    return result.rows || null;
};
exports.getCajasDiariasByRuta = getCajasDiariasByRuta;
// Actualizar una caja diaria
const updateCajaDiaria = async (id, caja) => {
    const result = await db_1.default.query(`UPDATE cajas_diarias SET 
      fecha_cierre = COALESCE($1, fecha_cierre),
      monto_final_esperado = COALESCE($2, monto_final_esperado),
      monto_final_real = COALESCE($3, monto_final_real),
      diferencia = COALESCE($4, diferencia),
      estado = COALESCE($5, estado),
      usuario_id = COALESCE($6, usuario_id),
      ruta_id = COALESCE($7, ruta_id),
      monto_base_inicial = COALESCE($8, monto_base_inicial)
    WHERE caja_diaria_id = $9 RETURNING *`, [
        caja.fecha_cierre,
        caja.monto_final_esperado,
        caja.monto_final_real,
        caja.diferencia,
        caja.estado,
        caja.usuario_id,
        caja.ruta_id,
        caja.monto_base_inicial,
        id
    ]);
    return result.rows[0] || null;
};
exports.updateCajaDiaria = updateCajaDiaria;
//validar fondos en la caja principal
const validarFondosCajaPrincipal = async (sucursal_id, monto_requerido) => {
    const result = await db_1.default.query(`SELECT saldo_actual 
    FROM cajas_sucursales  WHERE sucursal_id = $1`, [sucursal_id]);
    const saldoActual = result.rows[0]?.saldo_actual || 0;
    return saldoActual >= monto_requerido;
};
exports.validarFondosCajaPrincipal = validarFondosCajaPrincipal;
//actualizar la base de la caja diaria 
const updateBase = async (caja_diaria_id, nuevoMontoBase) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const result = await db_1.default.query(`UPDATE cajas_diarias SET monto_base_inicial = monto_base_inicial + $1 ,
      monto_final_esperado = monto_final_esperado + $1
    WHERE caja_diaria_id = $2 RETURNING *`, [nuevoMontoBase, caja_diaria_id]);
        if (result.rowCount === 0) {
            throw new Error('Caja diaria no encontrada');
        }
        // Obtener la sucursal_id de la caja diaria
        const sucursal_id = await client.query(`SELECT u.sucursal_id, u.usuario_id
    FROM cajas_diarias cd
    INNER JOIN usuarios u ON cd.usuario_id = u.usuario_id
    WHERE cd.caja_diaria_id = $1`, [caja_diaria_id]);
        if (sucursal_id.rowCount === 0) {
            throw new Error('Sucursal no encontrada');
        }
        // Actualizar el saldo de la caja principal
        const cajaUpdate = await client.query(`UPDATE cajas_sucursales
    SET saldo_actual = saldo_actual - $1
    WHERE sucursal_id = $2 RETURNING *`, [nuevoMontoBase, sucursal_id.rows[0].sucursal_id]);
        //  Registrar también el egreso en 'movimientos_caja_sucursal' para auditoría
        const movtoCaja = await client.query(`INSERT INTO movimientos_caja_sucursal (
        caja_sucursal_id,
        usuario_responsable_id,
        tipo_movimiento,
        monto,
        descripcion,
        fecha_movimiento,
        estado_movto
      ) VALUES (
        $1,
        $2,
        'egreso',
        $3,
        'Aumento de caja diaria',
        NOW(),
        'confirmado'
      ) RETURNING *`, [cajaUpdate.rows[0].sucursal_id, sucursal_id.rows[0].usuario_id, nuevoMontoBase]);
        if (movtoCaja.rowCount === 0) {
            throw new Error('No se pudo registrar el movimiento de caja');
        }
        await client.query('COMMIT');
        return result.rows[0] || null;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateBase = updateBase;
//cerrar caja diaria y actualizar el monto final real, diferencia y estado
const cerrarCajaDiaria = async (caja_diaria_id, monto_final_real, egresosCaja) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // Obtener la caja diaria para calcular la diferencia 
        const resCaja = await client.query(`SELECT monto_final_esperado ,monto_recaudo
      FROM cajas_diarias 
      WHERE caja_diaria_id = $1 FOR UPDATE`, [caja_diaria_id]);
        if (resCaja.rowCount === 0) {
            throw new Error('Caja diaria no encontrada');
        }
        const monto_final_esperado = resCaja.rows[0].monto_final_esperado || 0;
        const diferencia = monto_final_real - monto_final_esperado;
        const sucursal_id = await client.query(`SELECT u.sucursal_id  sucursal_id
      FROM cajas_diarias cd
      inner join  usuarios u on cd.usuario_id = u.usuario_id
      where cd.caja_diaria_id = $1`, [caja_diaria_id]);
        // Actualizar la caja diaria
        const result = await client.query(`UPDATE cajas_diarias
      SET fecha_cierre = NOW(), 
      monto_final_real = $1, 
      diferencia = $2,
       estado = 'cerrada'
      WHERE caja_diaria_id = $3 RETURNING *`, [monto_final_real, diferencia, caja_diaria_id]);
        //registar el movimiento en la caja sucursal
        if (result.rows[0].monto_recaudo > 0 || result.rows[0].monto_recaudo === null) {
            const movto = await client.query(`INSERT INTO movimientos_caja_sucursal (
    usuario_responsable_id, 
    monto, 
    caja_sucursal_id, 
    tipo_movimiento, 
    descripcion, 
    fecha_movimiento,
    estado_movto)
  VALUES (
    $1, 
    $2,
    $3, 
    $4, 
    $5, 
    $6,
    'confirmado') RETURNING *`, [
                result.rows[0].usuario_id, // $1
                result.rows[0].monto_recaudo || 0, // $2
                sucursal_id.rows[0].sucursal_id, // $3
                'ingreso', // $4
                'recaudos Cobros ' + new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }), // $5
                new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) // $6
            ]);
            if (movto.rowCount === 0) {
                throw new Error('Error al registrar el movimiento en la caja sucursal');
            }
            await client.query(`UPDATE cajas_sucursales
          SET saldo_actual = saldo_actual + $1,
              fecha_ultima_actualizacion = $3
          WHERE sucursal_id = $2`, [result.rows[0].monto_recaudo || 0, sucursal_id.rows[0].sucursal_id, new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })]);
        }
        //registrar el sobrante de la caja base
        const sobranteBase = result.rows[0].monto_base_inicial - egresosCaja;
        if (sobranteBase > 0) {
            const movto = await client.query(`INSERT INTO movimientos_caja_sucursal (
    usuario_responsable_id, 
    monto, 
    caja_sucursal_id, 
    tipo_movimiento, 
    descripcion, 
    fecha_movimiento,
    estado_movto)
  VALUES (
    $1, 
    $2,
    $3, 
    $4, 
    $5, 
    $6,
    'confirmado') RETURNING *`, [
                result.rows[0].usuario_id, // $1
                sobranteBase || 0, // $2
                sucursal_id.rows[0].sucursal_id, // $3
                'ingreso', // $4
                'Sobrante Base Caja Diaria del ' + new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }), // $5
                new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) // $6
            ]);
            if (movto.rowCount === 0) {
                throw new Error('Error al registrar el movimiento en la caja sucursal');
            }
            await client.query(`UPDATE cajas_sucursales
          SET saldo_actual = saldo_actual + $1,
              fecha_ultima_actualizacion = $3
          WHERE sucursal_id = $2`, [sobranteBase || 0, sucursal_id.rows[0].sucursal_id, new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })]);
        }
        await client.query('COMMIT');
        return result.rows[0] || null;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.cerrarCajaDiaria = cerrarCajaDiaria;
// Eliminar una caja diaria
const deleteCajaDiaria = async (id) => {
    await db_1.default.query(`DELETE FROM cajas_diarias WHERE caja_diaria_id = $1`, [id]);
};
exports.deleteCajaDiaria = deleteCajaDiaria;
exports.default = {
    abrirCajaDiaria: exports.abrirCajaDiaria,
    getAllCajasDiarias: exports.getAllCajasDiarias,
    getCajaDiariaById: exports.getCajaDiariaById,
    getCajasDiariasByUsuario: exports.getCajasDiariasByUsuario,
    getCajasDiariasByRuta: exports.getCajasDiariasByRuta,
    getCajaDiariaAbiertaByUsuario: exports.getCajaDiariaAbiertaByUsuario,
    updateCajaDiaria: exports.updateCajaDiaria,
    updateBase: exports.updateBase,
    deleteCajaDiaria: exports.deleteCajaDiaria,
    validarFondosCajaPrincipal: exports.validarFondosCajaPrincipal,
    cerrarCajaDiaria: exports.cerrarCajaDiaria
};
