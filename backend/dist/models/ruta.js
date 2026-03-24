"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRuta = createRuta;
exports.getRutas = getRutas;
exports.getRutasCobros = getRutasCobros;
exports.getRutaById = getRutaById;
exports.updateRuta = updateRuta;
exports.desactivarRuta = desactivarRuta;
exports.deleteRuta = deleteRuta;
const db_1 = __importDefault(require("../db/db"));
// Crear una nueva ruta
async function createRuta(ruta) {
    const newRuta = await db_1.default.query(`INSERT INTO rutas (sucursal_id, nombre_ruta, descripcion, zona, fecha_creacion, estado, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING * `, [
        ruta.sucursal_id,
        ruta.nombre_ruta,
        ruta.descripcion || null,
        ruta.zona || null,
        ruta.fecha_creacion || new Date().toISOString(),
        ruta.estado || 'activo',
        ruta.created_at || new Date().toISOString()
    ]);
    return newRuta.rows[0] || null;
}
// Obtener todas las rutas
async function getRutas(idSucursal) {
    const result = await db_1.default.query(`SELECT 
    r.*,
    COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') AS cobrador
FROM public.rutas r
LEFT JOIN public.asignaciones_rutas ar  ON r.ruta_id = ar.ruta_id AND ar.estado = 'activo'
LEFT JOIN public.usuarios u  ON ar.usuario_id = u.usuario_id
where r.sucursal_id = $1
order BY r.ruta_id ASC
    `, [
        idSucursal
    ]);
    return result.rows;
}
// Obtener todas las rutas
async function getRutasCobros(idSucursal) {
    const result = await db_1.default.query(`SELECT 
    r.*,
    COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') AS cobrador
FROM public.rutas r
LEFT JOIN public.asignaciones_rutas ar  ON r.ruta_id = ar.ruta_id AND ar.estado = 'activo'
LEFT JOIN public.usuarios u  ON ar.usuario_id = u.usuario_id
inner join cajas_diarias cd on u.usuario_id = cd.usuario_id and cd.estado='abierta'
inner join cobros c on c.usuario_id=u.usuario_id and c.estado='pendiente'
where r.sucursal_id = $1
group by r.ruta_id, u.nombres, u.apellidos
order BY r.ruta_id ASC

    `, [
        idSucursal
    ]);
    return result.rows;
}
// Buscar una ruta por ID
async function getRutaById(id) {
    const result = await db_1.default.query(`SELECT r.*, 
            COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') AS cobrador,
            u.usuario_id 
     FROM rutas r
     LEFT JOIN asignaciones_rutas ar ON r.ruta_id = ar.ruta_id AND ar.estado = 'activo'
     LEFT JOIN usuarios u ON ar.usuario_id = u.usuario_id
     WHERE r.ruta_id = $1`, [id]);
    return result.rows[0] || null;
}
// Actualizar una ruta
async function updateRuta(id, ruta) {
    const result = await db_1.default.query(`UPDATE rutas SET sucursal_id = $1, nombre_ruta = $2, descripcion = $3, zona = $4, fecha_creacion = $5, estado = $6, created_at = $7
     WHERE ruta_id = $8 RETURNING *`, [
        ruta.sucursal_id,
        ruta.nombre_ruta,
        ruta.descripcion || null,
        ruta.zona || null,
        ruta.fecha_creacion || new Date().toISOString(),
        ruta.estado || 'activo',
        ruta.created_at || new Date().toISOString(),
        id
    ]);
    return result.rows[0] || null;
}
//desactivar ruta
async function desactivarRuta(id) {
    const result = await db_1.default.query(`UPDATE rutas SET estado = 'INACTIVO'
     WHERE ruta_id = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
}
// Eliminar una ruta
async function deleteRuta(id) {
    const result = await db_1.default.query('DELETE FROM rutas WHERE ruta_id = $1 RETURNING *', [
        id
    ]);
    return result.rows[0] || null;
}
exports.default = {
    createRuta,
    getRutas,
    getRutasCobros,
    getRutaById,
    updateRuta,
    deleteRuta,
    desactivarRuta
};
