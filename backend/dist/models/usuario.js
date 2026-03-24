"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esAdmin = exports.getCobradoresActivos = exports.getUsuarioByEmail = exports.deleteUsuario = exports.updatePassword = exports.updateUsuario = exports.getUsuarioByDNI = exports.getUsuarioById = exports.getUsuarios = exports.createUsuario = void 0;
const db_1 = __importDefault(require("../db/db"));
//crear usuario
const createUsuario = async (usuario) => {
    const newUsuario = await db_1.default.query('INSERT INTO usuarios (sucursal_id, nombres, apellidos, dni, telefono, email, tipo_usuario, estado, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9 ) RETURNING *', [
        usuario.sucursal_id,
        usuario.nombres,
        usuario.apellidos,
        usuario.dni,
        usuario.telefono || null,
        usuario.email || null,
        usuario.tipo_usuario,
        usuario.estado || 'activo',
        usuario.password
    ]);
    return newUsuario.rows[0] || null;
};
exports.createUsuario = createUsuario;
//obtener todos los usuarios
const getUsuarios = async (idSucursal) => {
    const result = await db_1.default.query(`SELECT * FROM usuarios WHERE sucursal_id = $1 order by usuario_id asc`, [idSucursal]);
    return result.rows;
};
exports.getUsuarios = getUsuarios;
//buscar usuario por ID
const getUsuarioById = async (id) => {
    const result = await db_1.default.query('SELECT * FROM usuarios WHERE usuario_id = $1', [
        id
    ]);
    return result.rows[0] || null;
};
exports.getUsuarioById = getUsuarioById;
//buscar usuario por DNI
const getUsuarioByDNI = async (dni) => {
    const result = await db_1.default.query('SELECT * FROM usuarios WHERE dni = $1', [
        dni
    ]);
    return result.rows[0] || null;
};
exports.getUsuarioByDNI = getUsuarioByDNI;
//actualizar usuario
const updateUsuario = async (id, usuario) => {
    const updatedUsuario = await db_1.default.query(`UPDATE usuarios SET sucursal_id = $1, nombres = $2, apellidos = $3, dni = $4, telefono = $5, email = $6, tipo_usuario = $7, estado = $8 WHERE usuario_id = $9 returning *`, [
        usuario.sucursal_id,
        usuario.nombres,
        usuario.apellidos,
        usuario.dni,
        usuario.telefono || null,
        usuario.email || null,
        usuario.tipo_usuario,
        usuario.estado || 'activo',
        id
    ]);
    return updatedUsuario.rows[0] || null;
};
exports.updateUsuario = updateUsuario;
//actualizar contraseña de usuario
const updatePassword = async (id, newPassword) => {
    const updatedUsuario = await db_1.default.query(`UPDATE usuarios SET password = $1 WHERE usuario_id = $2 RETURNING *`, [newPassword, id]);
    return updatedUsuario.rows[0] || null;
};
exports.updatePassword = updatePassword;
//eliminar usuario
const deleteUsuario = async (id) => {
    const deletedUsuario = await db_1.default.query('DELETE FROM usuarios WHERE usuario_id = $1 RETURNING *', [id]);
    return deletedUsuario.rows[0] || null;
};
exports.deleteUsuario = deleteUsuario;
//obtener usuario por correo
const getUsuarioByEmail = async (email) => {
    const result = await db_1.default.query('SELECT * FROM usuarios WHERE email = $1', [
        email
    ]);
    return result.rows[0] || null;
};
exports.getUsuarioByEmail = getUsuarioByEmail;
//obtener cobradores activos y con ruta asignada
const getCobradoresActivos = async (idSucursal) => {
    const result = await db_1.default.query(`SELECT u.* FROM usuarios u
     inner JOIN asignaciones_rutas ar ON u.usuario_id = ar.usuario_id and ar.estado = 'activo'
     WHERE u.sucursal_id = $1  AND u.tipo_usuario = 2 AND u.estado = 'activo' order by u.usuario_id asc`, [idSucursal]);
    return result.rows;
};
exports.getCobradoresActivos = getCobradoresActivos;
const esAdmin = async (id) => {
    const result = await db_1.default.query('SELECT * FROM usuarios WHERE usuario_id = $1 AND tipo_usuario = 1', [id]);
    return result.rows[0] ? true : false;
};
exports.esAdmin = esAdmin;
exports.default = {
    createUsuario: exports.createUsuario,
    getUsuarios: exports.getUsuarios,
    getUsuarioById: exports.getUsuarioById,
    getUsuarioByDNI: exports.getUsuarioByDNI,
    getUsuarioByEmail: exports.getUsuarioByEmail,
    updateUsuario: exports.updateUsuario,
    updatePassword: exports.updatePassword,
    deleteUsuario: exports.deleteUsuario,
    getCobradoresActivos: exports.getCobradoresActivos,
    esAdmin: exports.esAdmin
};
