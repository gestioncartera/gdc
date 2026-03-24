"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asignarRutaSegura = exports.desactivarAsignacionRuta = exports.isRutaAsignada = exports.updateAsignacionRuta = exports.getUsuarioAsignadoRuta = exports.getRutaAsignadaUsuario = exports.deleteAsignacionRuta = exports.getAsignacionesRuta = exports.createAsignacionRuta = void 0;
const db_1 = __importDefault(require("../db/db"));
// Crear una nueva asignación de ruta
const createAsignacionRuta = async (asignacionRuta) => {
    const newAsignacionRuta = await db_1.default.query('INSERT INTO asignaciones_rutas (ruta_id, usuario_id, fecha_asignacion, fecha_fin, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *', [
        asignacionRuta.ruta_id,
        asignacionRuta.usuario_id,
        asignacionRuta.fecha_asignacion || new Date().toISOString().slice(0, 10),
        asignacionRuta.fecha_fin || null,
        asignacionRuta.estado || 'activo'
        //asignacionRuta.created_at || new Date().toISOString().slice(0, 10),
    ]);
    return newAsignacionRuta.rows[0] || null;
};
exports.createAsignacionRuta = createAsignacionRuta;
// Obtener todas las asignaciones de ruta
const getAsignacionesRuta = async () => {
    const result = await db_1.default.query('SELECT * FROM asignaciones_rutas');
    return result.rows;
};
exports.getAsignacionesRuta = getAsignacionesRuta;
// Eliminar asignación de ruta
const deleteAsignacionRuta = async (id) => {
    const deletedAsignacionRuta = await db_1.default.query('DELETE FROM asignaciones_rutas WHERE asignacion_id = $1 RETURNING *', [id]);
    return deletedAsignacionRuta.rows[0] || null;
};
exports.deleteAsignacionRuta = deleteAsignacionRuta;
//obtener ruta asignada a un usuario
const getRutaAsignadaUsuario = async (usuario_id) => {
    const result = await db_1.default.query('SELECT ruta_id FROM asignaciones_rutas WHERE usuario_id = $1 AND estado = $2', [usuario_id, 'activo']);
    return result.rows[0] || null;
};
exports.getRutaAsignadaUsuario = getRutaAsignadaUsuario;
//obtener el usuario asignado a una ruta
const getUsuarioAsignadoRuta = async (ruta_id) => {
    const result = await db_1.default.query('SELECT usuario_id FROM asignaciones_rutas WHERE ruta_id = $1 AND estado = $2', [ruta_id, 'activo']);
    return result.rows[0] || null;
};
exports.getUsuarioAsignadoRuta = getUsuarioAsignadoRuta;
// Actualizar asignación de ruta
const updateAsignacionRuta = async (id, asignacionRuta) => {
    const updatedAsignacionRuta = await db_1.default.query('UPDATE asignaciones_rutas SET ruta_id = $1, empleado_id = $2, fecha_asignacion = $3, fecha_fin = $4, estado = $5 WHERE asignacion_id = $6 RETURNING *', [
        asignacionRuta.ruta_id,
        asignacionRuta.usuario_id,
        asignacionRuta.fecha_asignacion || new Date(),
        asignacionRuta.fecha_fin || null,
        asignacionRuta.estado || 'activo',
        id
    ]);
    return updatedAsignacionRuta.rows[0] || null;
};
exports.updateAsignacionRuta = updateAsignacionRuta;
//validar si la ruta ya está asignada a un usuario 
const isRutaAsignada = async (ruta_id, usuario_id) => {
    // console.log("entro a models",ruta_id,usuario_id);
    const result = await db_1.default.query('SELECT * FROM asignaciones_rutas WHERE ruta_id = $1 AND usuario_id = $2 AND estado = $3', [ruta_id, usuario_id, 'activo']);
    return result.rows.length > 0;
};
exports.isRutaAsignada = isRutaAsignada;
//desactivar una asignación de ruta
const desactivarAsignacionRuta = async (idUsuario, idRuta) => {
    const desactivatedAsignacionRuta = await db_1.default.query(`UPDATE asignaciones_rutas 
     SET estado = $1, fecha_fin = $4 
     WHERE (usuario_id = $2 OR ruta_id = $3) AND estado = 'activo' 
     RETURNING *`, ['inactivo',
        idUsuario,
        idRuta,
        new Date().toISOString().slice(0, 10)]);
    //console.log(desactivatedAsignacionRuta);
    return desactivatedAsignacionRuta.rows[0] || null;
};
exports.desactivarAsignacionRuta = desactivarAsignacionRuta;
// Función óptima: Transacción para limpiar asignaciones previas y crear la nueva
const asignarRutaSegura = async (asignacionRuta) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // 1. Desactivar cualquier conflicto activo (Ruta ya asignada a otro O Usuario con otra ruta)
        await client.query(`UPDATE asignaciones_rutas 
       SET estado = 'inactivo', fecha_fin = $3 
       WHERE (usuario_id = $1 OR ruta_id = $2) AND estado = 'activo'`, [asignacionRuta.usuario_id, asignacionRuta.ruta_id, new Date().toISOString().slice(0, 10)]);
        // 2. Crear la nueva asignación
        const newAsignacion = await client.query(`INSERT INTO asignaciones_rutas (ruta_id, usuario_id, fecha_asignacion, fecha_fin, estado) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`, [
            asignacionRuta.ruta_id,
            asignacionRuta.usuario_id,
            asignacionRuta.fecha_asignacion || new Date().toISOString().slice(0, 10),
            asignacionRuta.fecha_fin || null,
            'activo'
        ]);
        await client.query('COMMIT');
        return newAsignacion.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.asignarRutaSegura = asignarRutaSegura;
exports.default = {
    createAsignacionRuta: exports.createAsignacionRuta,
    getAsignacionesRuta: exports.getAsignacionesRuta,
    getRutaAsignadaUsuario: exports.getRutaAsignadaUsuario,
    deleteAsignacionRuta: exports.deleteAsignacionRuta,
    updateAsignacionRuta: exports.updateAsignacionRuta,
    isRutaAsignada: exports.isRutaAsignada,
    desactivarAsignacionRuta: exports.desactivarAsignacionRuta,
    asignarRutaSegura: exports.asignarRutaSegura,
    getUsuarioAsignadoRuta: exports.getUsuarioAsignadoRuta
};
