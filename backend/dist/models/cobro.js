"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCobro = exports.validarCobro = exports.updateMontoCobroConCaja = exports.updateCobro = exports.getTotalCobradoByUsuarioId = exports.getCantCobrosHoy = exports.getTotalCobradoHoy = exports.getCobrosPendientesByUsuarioId = exports.getCobrosByPrestamoId = exports.getCobrosByRutaId = exports.getCobroInfoById = exports.getCobrosByIds = exports.getCobrosPendientesByPrestamoId = exports.getCobroById = exports.getAllCobros = exports.createCobro = void 0;
exports.validarMultiplesCobros = validarMultiplesCobros;
const db_1 = __importDefault(require("../db/db"));
// Crear cobro y actualizar caja diaria (Transacción)
const createCobro = async (cobro) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Verificar Caja Diaria ABIERTA del usuario
        const resCaja = await client.query(`SELECT caja_diaria_id FROM cajas_diarias 
       WHERE usuario_id = $1 AND estado = 'abierta' FOR UPDATE`, [cobro.usuario_id]);
        if (resCaja.rowCount === 0) {
            throw new Error('No tienes una caja diaria abierta para registrar cobros.');
        }
        const cajaId = resCaja.rows[0].caja_diaria_id;
        // 2. Insertar el Cobro
        const resCobro = await client.query(`INSERT INTO cobros (prestamo_id, usuario_id, fecha_cobro, monto_cobrado, estado) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [
            cobro.prestamo_id,
            cobro.usuario_id,
            cobro.fecha_cobro || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
            cobro.monto_cobrado,
            cobro.estado || 'pendiente' // Asumo 'confirmado' si ya entra dinero
        ]);
        const nuevoCobro = resCobro.rows[0];
        // 3. Actualizar monto_final_esperado en Caja Diaria
        // Se usa COALESCE para tratar nulos como 0 si es la primera suma
        await client.query(`UPDATE cajas_diarias 
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) + $1,
       monto_recaudo = COALESCE(monto_recaudo, 0) + $1
       WHERE caja_diaria_id = $2`, [cobro.monto_cobrado,
            cajaId]);
        await client.query('COMMIT');
        return nuevoCobro;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createCobro = createCobro;
// Obtener todos los cobros
const getAllCobros = async () => {
    const result = await db_1.default.query(`SELECT * FROM cobros order by cobro_id asc`);
    return result.rows || null;
};
exports.getAllCobros = getAllCobros;
// Obtener un cobro por ID
const getCobroById = async (cobro_id) => {
    const result = await db_1.default.query(`SELECT * FROM cobros WHERE cobro_id = $1`, [cobro_id]);
    return result.rows[0] || null;
};
exports.getCobroById = getCobroById;
//Obtener cobros pendientes de un prestamo por ID
const getCobrosPendientesByPrestamoId = async (prestamo_id) => {
    const result = await db_1.default.query(`SELECT * FROM cobros 
    WHERE prestamo_id = $1 
    AND estado='pendiente' 
    order by fecha_cobro asc`, [prestamo_id]);
    return result.rows || null;
};
exports.getCobrosPendientesByPrestamoId = getCobrosPendientesByPrestamoId;
// Obtener múltiples cobros por sus IDs
const getCobrosByIds = async (cobroIds) => {
    if (cobroIds.length === 0)
        return [];
    const result = await db_1.default.query(`SELECT * FROM cobros WHERE cobro_id = ANY($1)`, [cobroIds]);
    return result.rows;
};
exports.getCobrosByIds = getCobrosByIds;
//obtener la informacion del cobro por ID
const getCobroInfoById = async (cobro_id) => {
    const result = await db_1.default.query(`select c.cobro_id,
      p.prestamo_id,
      cl.cliente_id,
      u.usuario_id,
      c.fecha_cobro,
      c.monto_cobrado,
      c.estado
FROM  usuarios u 
    inner join cobros c on u.usuario_id = c.usuario_id and c.cobro_id=$1
    inner join prestamos p on c.prestamo_id = p.prestamo_id
    inner join clientes cl on p.cliente_id = cl.cliente_id`, [cobro_id]);
    return result.rows[0] || null;
};
exports.getCobroInfoById = getCobroInfoById;
//obtener cobros por ruta ID
const getCobrosByRutaId = async (ruta_id) => {
    const result = await db_1.default.query(`SELECT c.cobro_id,
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
    order by cl.cliente_id,c.fecha_cobro desc`, [ruta_id]); //and ar.estado='activo'
    return result.rows || null;
};
exports.getCobrosByRutaId = getCobrosByRutaId;
//obtener cobros por prestamo ID
const getCobrosByPrestamoId = async (prestamo_id) => {
    const result = await db_1.default.query(`SELECT c.fecha_cobro, 
    sum(c.monto_cobrado) as monto_cobrado, 
    c.estado,
    p.fecha_desembolso,
    p.fecha_fin_prestamo
    FROM cobros c
    inner join prestamos p on c.prestamo_id=p.prestamo_id
    WHERE p.prestamo_id = $1
    group by p.prestamo_id,c.fecha_cobro, c.estado, p.fecha_desembolso, p.fecha_fin_prestamo
    order by c.fecha_cobro desc`, [prestamo_id]);
    return result.rows || null;
};
exports.getCobrosByPrestamoId = getCobrosByPrestamoId;
//obtener cobros pendientes  por usuario ID
const getCobrosPendientesByUsuarioId = async (usuario_id) => {
    const result = await db_1.default.query(`SELECT *
    FROM cobros c
    WHERE c.usuario_id = $1 and c.estado='pendiente'
    order by c.fecha_cobro desc`, [usuario_id]);
    return result.rows || null;
};
exports.getCobrosPendientesByUsuarioId = getCobrosPendientesByUsuarioId;
//Reporte, Obtener los cobros realizados en una sucursal en un dia
const getTotalCobradoHoy = async (sucursal_id, fecha) => {
    const result = await db_1.default.query(`SELECT coalesce(sum(coalesce(c.monto_cobrado, 0)), 0) as total_cobrado
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE u.sucursal_id = $1 and date(c.fecha_cobro) = date($2)`, [sucursal_id, fecha]);
    return result.rows[0].total_cobrado || 0;
};
exports.getTotalCobradoHoy = getTotalCobradoHoy;
//REPORTE, obetener la cantidad de prestamos que aun se han realizado el cobro para una sucursal
const getCantCobrosHoy = async (sucursal_id, fecha) => {
    const result = await db_1.default.query(`SELECT COUNT(DISTINCT c.prestamo_id) as cantidad_prestamos
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE u.sucursal_id = $1 and date(c.fecha_cobro) = date($2)`, [sucursal_id, fecha]);
    return result.rows[0].cantidad_prestamos || 0;
};
exports.getCantCobrosHoy = getCantCobrosHoy;
//Reporte de cobros por cobrador, obtener el total cobrado por un cobrador en un dia
const getTotalCobradoByUsuarioId = async (usuario_id, fecha) => {
    const result = await db_1.default.query(`SELECT coalesce(sum(coalesce(c.monto_cobrado, 0)), 0) as total_cobrado,
    u.usuario_id
    FROM cobros c
    inner join usuarios u on c.usuario_id = u.usuario_id
    WHERE c.usuario_id = $1 and date(c.fecha_cobro) = date($2)`, [usuario_id, fecha]);
    return result.rows[0].total_cobrado || 0;
};
exports.getTotalCobradoByUsuarioId = getTotalCobradoByUsuarioId;
// Actualizar un cobro
const updateCobro = async (cobro_id, cobro) => {
    const result = await db_1.default.query(`UPDATE cobros SET prestamo_id = $1, usuario_id = $2, fecha_cobro = $3, monto_cobrado = $4, estado = $5 WHERE cobro_id = $6 RETURNING *`, [
        cobro.prestamo_id,
        cobro.usuario_id,
        cobro.fecha_cobro,
        cobro.monto_cobrado,
        cobro.estado,
        cobro_id,
    ]);
    return result.rows[0] || null;
};
exports.updateCobro = updateCobro;
// Actualizar monto de cobro y sincronizar caja diaria (Transacción)
const updateMontoCobroConCaja = async (cobro_id, nuevo_monto) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Obtener el cobro actual para saber el monto anterior
        const resCobroActual = await client.query(`SELECT c.*, cd.caja_diaria_id, cd.monto_final_esperado
       FROM cobros c
       INNER JOIN cajas_diarias cd ON c.usuario_id = cd.usuario_id AND cd.estado = 'abierta'
       WHERE c.cobro_id = $1
       FOR UPDATE OF cd`, [cobro_id]);
        if (resCobroActual.rowCount === 0) {
            throw new Error('Cobro no encontrado o no tiene caja diaria abierta.');
        }
        const cobroActual = resCobroActual.rows[0];
        const montoAnterior = parseFloat(cobroActual.monto_cobrado);
        const cajaId = cobroActual.caja_diaria_id;
        const diferencia = nuevo_monto - montoAnterior;
        // 2. Actualizar el cobro con el nuevo monto
        const resUpdateCobro = await client.query(`UPDATE cobros SET monto_cobrado = $1 WHERE cobro_id = $2 RETURNING *`, [nuevo_monto, cobro_id]);
        // 3. Actualizar la caja diaria (sumar la diferencia)
        await client.query(`UPDATE cajas_diarias 
       SET monto_final_esperado = COALESCE(monto_final_esperado, 0) + $1,
        monto_recaudo = COALESCE(monto_recaudo, 0) + $1
       WHERE caja_diaria_id = $2`, [diferencia, cajaId]);
        await client.query('COMMIT');
        return resUpdateCobro.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateMontoCobroConCaja = updateMontoCobroConCaja;
//cambiar estado de un cobro a pagado
const validarCobro = async (cobro_id) => {
    const result = await db_1.default.query(`UPDATE cobros SET estado = $1 WHERE cobro_id = $2 RETURNING *`, [
        'confirmado',
        cobro_id
    ]);
    return result.rows[0] || null;
};
exports.validarCobro = validarCobro;
// Eliminar un cobro
const deleteCobro = async (cobro_id) => {
    const result = await db_1.default.query(`DELETE FROM cobros WHERE cobro_id = $1 RETURNING *`, [cobro_id]);
    return result.rows[0] || null;
};
exports.deleteCobro = deleteCobro;
// Validar un cobro y actualizar el saldo del préstamo asociado
// Validar Múltiples Cobros (Versión Optimizada)
// Validar Múltiples Cobros (Versión Optimizada)
async function validarMultiplesCobros(cobroIds) {
    const client = await db_1.default.connect();
    const resultados = {
        procesados: [],
        errores: []
    };
    try {
        await client.query('BEGIN');
        // 1. Obtener todos los datos necesarios en UNA sola consulta
        // Esto reduce drásticamente el tiempo
        const cobrosQuery = await client.query(`SELECT c.cobro_id, 
      c.monto_cobrado, 
      c.prestamo_id, 
      c.estado ,
      p.estado_prestamo,
      p.sucursal_id,
      c.usuario_id
       FROM cobros c 
       inner join prestamos p on c.prestamo_id = p.prestamo_id
       WHERE c.cobro_id = ANY($1) FOR UPDATE`, [cobroIds]);
        const cobrosAProcesar = cobrosQuery.rows;
        for (const cobro of cobrosAProcesar) {
            if (cobro.estado === 'confirmado') {
                resultados.errores.push({ id: cobro.cobro_id, motivo: 'Ya estaba confirmado' });
                continue;
            }
            try {
                await client.query(`SAVEPOINT sp_${cobro.cobro_id}`);
                // A. Marcar cobro
                await client.query(`UPDATE cobros SET estado = 'confirmado' WHERE cobro_id = $1`, [cobro.cobro_id]);
                // B. Actualizar Préstamo
                await client.query(`UPDATE prestamos 
                 SET saldo_pendiente = saldo_pendiente - $1,
                     estado_prestamo = CASE WHEN (saldo_pendiente - $1) <= 0.01 THEN 'pagado' ELSE estado_prestamo END
                 WHERE prestamo_id = $2`, [cobro.monto_cobrado, cobro.prestamo_id]);
                resultados.procesados.push(cobro.cobro_id);
                await client.query(`RELEASE SAVEPOINT sp_${cobro.cobro_id}`);
            }
            catch (err) {
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
const resumenCobrosCoradorRuta = async (sucursal_id, fecha) => {
    const result = await db_1.default.query(`  SELECT  u.usuario_id,
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
    GROUP BY u.usuario_id, r.ruta_id, p.cant`, [sucursal_id, fecha]);
    return result.rows;
};
exports.default = {
    createCobro: exports.createCobro,
    getAllCobros: exports.getAllCobros,
    getCobroById: exports.getCobroById,
    getCobrosByIds: exports.getCobrosByIds,
    getCobrosByPrestamoId: exports.getCobrosByPrestamoId,
    getCobrosByRutaId: exports.getCobrosByRutaId,
    getCobroInfoById: exports.getCobroInfoById,
    getCobrosPendientesByPrestamoId: exports.getCobrosPendientesByPrestamoId,
    getCobrosPendientesByUsuarioId: exports.getCobrosPendientesByUsuarioId,
    getTotalCobradoHoy: exports.getTotalCobradoHoy,
    getCantCobrosHoy: exports.getCantCobrosHoy,
    updateMontoCobroConCaja: exports.updateMontoCobroConCaja,
    updateCobro: exports.updateCobro,
    deleteCobro: exports.deleteCobro,
    validarCobro: exports.validarCobro,
    validarMultiplesCobros,
    resumenCobrosCoradorRuta
};
