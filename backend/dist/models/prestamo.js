"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrestamo = exports.updatePrestamo = exports.getPrestamosInfo = exports.getPrestamosEnCursoSucursal = exports.getTotalCarteraSucursal = exports.getCobradorByPrestamoId = exports.getPrestamosByClienteId = exports.getPrestamoInfoById = exports.getPrestamoById = exports.PrestamosPendientes = exports.getAllPrestamos = exports.rechazarPrestamo = exports.confirmarPrestamo = exports.createPrestamoAdmin = exports.createPrestamo = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear préstamo con validación de caja y registro de egreso (Transacción)
const createPrestamo = async (prestamo) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Verificar si el usuario tiene Caja Diaria ABIERTA
        const resCaja = await client.query(`SELECT caja_diaria_id, monto_final_esperado,ruta_id -- Asumiendo que tienes un campo saldo_final_esperado o similar calculado
       FROM cajas_diarias 
       WHERE usuario_id = $1 AND estado = 'abierta' 
       FOR UPDATE`, // Bloqueamos la fila para evitar concurrencia
        [prestamo.id_usuario_creacion]);
        if (resCaja.rowCount === 0) {
            throw new Error('El usuario no tiene una caja diaria abierta para realizar desembolsos.');
        }
        const cajaDiaria = resCaja.rows[0];
        // *OPCIONAL*: Validar saldo suficiente en caja diaria (si manejas saldo en tiempo real)
        if (cajaDiaria.monto_final_esperado < prestamo.monto_prestamo) {
            throw new Error('Saldo insuficiente en caja diaria para desembolsar este préstamo.');
        }
        // 2. Insertar el PRÉSTAMO
        const resPrestamo = await client.query(`INSERT INTO prestamos (
          cliente_id, sucursal_id, monto_prestamo, fecha_desembolso, 
          estado_prestamo, saldo_pendiente, created_at, tipo_prestamo_id, 
          valor_intereses, valor_cuota, fecha_fin_prestamo, id_usuario_creacion
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`, [
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
        ]);
        const nuevoPrestamo = resPrestamo.rows[0];
        // 3. Registrar el desembolso como EGRESO en la Caja Sucursal (o Caja Diaria según tu modelo)
        // Aquí registramos que salió dinero de la caja del usuario
        await client.query(`INSERT INTO egresos_operacion (
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
      )`, [prestamo.id_usuario_creacion,
            cajaDiaria.ruta_id,
            new Date(),
            'Desembolso Préstamo #' + nuevoPrestamo.prestamo_id,
            prestamo.monto_prestamo,
            'Se realizo prestamo',
            'pendiente'
        ]);
        await client.query(`UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado  - $1
       WHERE caja_diaria_id = $2 AND estado = 'abierta'`, [prestamo.monto_prestamo, cajaDiaria.caja_diaria_id]);
        await client.query('COMMIT');
        return nuevoPrestamo;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createPrestamo = createPrestamo;
//crear prestamos para usuario administrador sin validar caja diaria ni registrar egreso
const createPrestamoAdmin = async (prestamo) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const cajaSurcursal = await client.query(`SELECT * 
       FROM cajas_sucursales
        WHERE sucursal_id = $1
        FOR UPDATE`, // Bloqueamos la fila para evitar concurrencia
        [prestamo.sucursal_id]);
        if (cajaSurcursal.rows.length === 0) {
            throw new Error('No se encontró una caja  para la sucursal.');
        }
        if (cajaSurcursal.rows[0].saldo_actual < prestamo.monto_prestamo) {
            throw new Error('Saldo insuficiente en caja para realizar este préstamo.');
        }
        const UpdateCaja = await client.query(`UPDATE cajas_sucursales
       SET saldo_actual = saldo_actual - $1
       WHERE caja_sucursal_id = $2`, [prestamo.monto_prestamo, cajaSurcursal.rows[0].caja_sucursal_id]);
        if (UpdateCaja.rowCount === 0) {
            throw new Error('Error al actualizar saldo en caja sucursal.');
        }
        const movtoCaja = await client.query(`INSERT INTO movimientos_caja_sucursal (
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
      ) RETURNING *`, [prestamo.sucursal_id,
            'egreso',
            prestamo.monto_prestamo,
            'Desembolso Préstamo por administrador',
            prestamo.id_usuario_creacion,
            'confirmado',
            new Date()
        ]);
        if (movtoCaja.rows.length === 0) {
            throw new Error('Error al registrar movimiento en caja sucursal.');
        }
        const result = await db_1.default.query(`INSERT INTO prestamos (
        cliente_id, sucursal_id, monto_prestamo, fecha_desembolso,
        estado_prestamo, saldo_pendiente, created_at, tipo_prestamo_id,
        valor_intereses, valor_cuota, fecha_fin_prestamo, id_usuario_creacion
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`, [
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
        ]);
        if (result.rows.length === 0) {
            throw new Error('Error al crear el préstamo.');
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
exports.createPrestamoAdmin = createPrestamoAdmin;
//confirmar prestamo
const confirmarPrestamo = async (prestamo_id) => {
    const result = await db_1.default.query(`UPDATE prestamos
     SET estado_prestamo = 'en curso'
     WHERE prestamo_id = $1 RETURNING *`, [prestamo_id]);
    return result.rows[0] || null;
};
exports.confirmarPrestamo = confirmarPrestamo;
//rechazar prestamo
const rechazarPrestamo = async (prestamo_id) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Actualizar el estado del préstamo a 'rechazado'
        const resPrestamo = await client.query(`UPDATE prestamos
        SET estado_prestamo = 'rechazado'
        WHERE prestamo_id = $1 RETURNING *`, [prestamo_id]);
        if (resPrestamo.rows.length === 0) {
            throw new Error('Préstamo no encontrado');
        }
        const prestamo = resPrestamo.rows[0];
        // 2. Obtener la caja diaria abierta del usuario
        const resCaja = await client.query(`SELECT * FROM cajas_diarias
       WHERE usuario_id = $1 AND estado = 'abierta'`, [prestamo.id_usuario_creacion]);
        if (resCaja.rows.length === 0) {
            throw new Error('No hay caja diaria abierta para este usuario');
        }
        const cajaDiaria = resCaja.rows[0];
        // 3. cambiar estado  del egreso 
        const egreso = await client.query(`UPDATE egresos_operacion
       SET estado_egreso = 'rechazado'
       WHERE usuario_id = $1 AND concepto = 'Desembolso Préstamo #' || $2`, [prestamo.id_usuario_creacion, prestamo_id]);
        if (egreso.rows.length === 0) {
            throw new Error('Error al actualizar el estado del egreso.');
        }
        // 4. Actualizar el saldo de la caja diaria
        await client.query(`UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado + $1
       WHERE caja_diaria_id = $2`, [prestamo.monto_prestamo, cajaDiaria.caja_id]);
        await client.query('COMMIT');
        return prestamo;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.rechazarPrestamo = rechazarPrestamo;
// Obtener todos los préstamos
const getAllPrestamos = async () => {
    const result = await db_1.default.query(`SELECT * FROM prestamos order by prestamo_id asc`);
    return result.rows;
};
exports.getAllPrestamos = getAllPrestamos;
//obtener prestamos pendientes de una sucursal
const PrestamosPendientes = async (sucursal_id) => {
    const result = await db_1.default.query(`SELECT p.*, clientes.nombres||' '||clientes.apellidos AS cliente ,
    tipo_prestamo.porcentaje as tasa_interes,
    usuarios.nombres||' '||usuarios.apellidos AS nombre_cobrador
    FROM prestamos p 
    inner join clientes on p.cliente_id=clientes.cliente_id
    inner join tipo_prestamo on p.tipo_prestamo_id=tipo_prestamo.id_tipo_prestamo
    inner join usuarios on p.id_usuario_creacion=usuarios.usuario_id
     WHERE p.sucursal_id = $1 AND p.estado_prestamo = 'pendiente' 
     ORDER BY prestamo_id ASC`, [sucursal_id]);
    return result.rows;
};
exports.PrestamosPendientes = PrestamosPendientes;
// Obtener un préstamo por ID
const getPrestamoById = async (prestamo_id) => {
    const result = await db_1.default.query(`SELECT prestamos.prestamo_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
    prestamos.saldo_pendiente,
    prestamos.valor_cuota,
    prestamos.fecha_fin_prestamo,
      rutas.nombre_ruta
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    inner join rutas on clientes.id_ruta=rutas.ruta_id
    WHERE prestamo_id = $1`, [prestamo_id]);
    return result.rows[0] || null;
};
exports.getPrestamoById = getPrestamoById;
//Obtener toda informacion de prestamo por id
const getPrestamoInfoById = async (prestamo_id) => {
    const result = await db_1.default.query(`SELECT clientes.nombres||' '||clientes.apellidos AS cliente ,prestamos.*
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    WHERE prestamo_id = $1`, [prestamo_id]);
    return result.rows[0] || null;
};
exports.getPrestamoInfoById = getPrestamoInfoById;
//obtener prestamos por cliente
const getPrestamosByClienteId = async (cliente_id) => {
    const result = await db_1.default.query(`SELECT  prestamos.prestamo_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
    prestamos.saldo_pendiente,
    prestamos.valor_cuota,
    prestamos.fecha_fin_prestamo
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    WHERE clientes.cliente_id = $1 and prestamos.estado_prestamo='en curso'`, [cliente_id]);
    return result.rows;
};
exports.getPrestamosByClienteId = getPrestamosByClienteId;
//Obtener el Cobrador responsable de un préstamo y sus cobros
const getCobradorByPrestamoId = async (prestamo_id) => {
    const result = await db_1.default.query(`SELECT
    ar.usuario_id  
    FROM prestamos
    inner join clientes ON prestamos.cliente_id = clientes.cliente_id
    INNER JOIN asignaciones_rutas ar ON clientes.id_ruta = ar.ruta_id
    WHERE prestamos.prestamo_id = $1 AND ar.estado = 'activo'`, [prestamo_id]);
    return result.rows[0] || null;
};
exports.getCobradorByPrestamoId = getCobradorByPrestamoId;
//obtener el total de cartera de una sucursal
const getTotalCarteraSucursal = async (sucursal_id) => {
    const result = await db_1.default.query(`SELECT SUM(prestamos.saldo_pendiente) AS total_cartera
    FROM prestamos
    WHERE prestamos.sucursal_id = $1`, [sucursal_id]);
    return result.rows[0].total_cartera || 0;
};
exports.getTotalCarteraSucursal = getTotalCarteraSucursal;
//Obtener la cantidad de prestamos en curso de una sucursal
const getPrestamosEnCursoSucursal = async (sucursal_id) => {
    const result = await db_1.default.query(`SELECT COUNT(*) AS prestamos_en_curso
    FROM prestamos
    WHERE prestamos.sucursal_id = $1 AND prestamos.estado_prestamo = 'en curso'`, [sucursal_id]);
    return result.rows[0].prestamos_en_curso || 0;
};
exports.getPrestamosEnCursoSucursal = getPrestamosEnCursoSucursal;
//Obtener prestamos con informacion
const getPrestamosInfo = async () => {
    const result = await db_1.default.query(`SELECT  clientes.cliente_id,
    clientes.nombres||' '||clientes.apellidos AS cliente ,
     prestamos.*
    FROM  clientes
    inner join prestamos on clientes.cliente_id=prestamos.cliente_id
    order by prestamos.prestamo_id asc`);
    return result.rows;
};
exports.getPrestamosInfo = getPrestamosInfo;
// Actualizar un préstamo
const updatePrestamo = async (prestamo_id, prestamo) => {
    const result = await db_1.default.query(`UPDATE prestamos SET  monto_prestamo = $2, 
    tipo_prestamo_id = $3,
    valor_intereses = $4, 
    valor_cuota = $5,
    fecha_desembolso = $6, 
    saldo_pendiente = $7, 
    fecha_fin_prestamo = $8 
    WHERE prestamo_id = $1 RETURNING *`, [
        prestamo_id,
        prestamo.monto_prestamo,
        prestamo.tipo_prestamo_id,
        prestamo.valor_intereses,
        prestamo.valor_cuota,
        prestamo.fecha_desembolso,
        prestamo.saldo_pendiente,
        prestamo.fecha_fin_prestamo
    ]);
    return result.rows[0] || null;
};
exports.updatePrestamo = updatePrestamo;
// Eliminar un préstamo
const deletePrestamo = async (prestamo_id) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const result = await db_1.default.query(`DELETE FROM prestamos 
    WHERE prestamo_id = $1  and estado_prestamo = 'pendiente' RETURNING *`, [prestamo_id]);
        const updateCaja = await client.query(`UPDATE cajas_diarias
       SET monto_final_esperado = monto_final_esperado + $1
        WHERE  usuario_id = $2
           AND estado = 'abierta'`, [result.rows[0].monto_prestamo,
            result.rows[0].id_usuario_creacion
        ]);
        const deleteEgreso = await client.query(`DELETE FROM egresos_operacion 
       WHERE concepto = $1 AND usuario_id = $2 and estado_egreso = 'pendiente'`, ['Desembolso Préstamo #' + prestamo_id, result.rows[0].id_usuario_creacion]);
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
exports.deletePrestamo = deletePrestamo;
exports.default = {
    createPrestamo: exports.createPrestamo,
    getAllPrestamos: exports.getAllPrestamos,
    getPrestamoById: exports.getPrestamoById,
    getPrestamosByClienteId: exports.getPrestamosByClienteId,
    getCobradorByPrestamoId: exports.getCobradorByPrestamoId,
    getPrestamosInfo: exports.getPrestamosInfo,
    getPrestamoInfoById: exports.getPrestamoInfoById,
    getTotalCarteraSucursal: exports.getTotalCarteraSucursal,
    getPrestamosEnCursoSucursal: exports.getPrestamosEnCursoSucursal,
    updatePrestamo: exports.updatePrestamo,
    confirmarPrestamo: exports.confirmarPrestamo,
    deletePrestamo: exports.deletePrestamo,
    rechazarPrestamo: exports.rechazarPrestamo,
    PrestamosPendientes: exports.PrestamosPendientes,
    createPrestamoAdmin: exports.createPrestamoAdmin
};
