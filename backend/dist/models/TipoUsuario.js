"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTipoUsuario = exports.deleteTipoUsuario = exports.getTiposUsuario = exports.createTipoUsuario = void 0;
const db_1 = __importDefault(require("../db/db"));
//crear tipo de usuario
const createTipoUsuario = async (tipoUsuario) => {
    const newTipoUsuario = await db_1.default.query('INSERT INTO tipo_usuario (nombre_tipo_usuario, descripcion_tipo_usuario) VALUES ($1, $2) RETURNING *', [
        tipoUsuario.nombre_tipo_usuario,
        tipoUsuario.descripcion_tipo_usuario || null
    ]);
    return newTipoUsuario.rows[0] || null;
};
exports.createTipoUsuario = createTipoUsuario;
//obtener todos los tipos de usuario
const getTiposUsuario = async () => {
    const result = await db_1.default.query('SELECT * FROM tipo_usuario');
    return result.rows;
};
exports.getTiposUsuario = getTiposUsuario;
//eliminar usuario
const deleteTipoUsuario = async (id) => {
    const deletedTipoUsuario = await db_1.default.query('DELETE FROM tipo_usuario WHERE id_tipo_usuario = $1 RETURNING *', [id]);
    return deletedTipoUsuario.rows[0] || null;
};
exports.deleteTipoUsuario = deleteTipoUsuario;
//actualizar tipo de usuario
const updateTipoUsuario = async (id, tipoUsuario) => {
    const updatedTipoUsuario = await db_1.default.query('UPDATE tipo_usuario SET nombre_tipo_usuario = $1, descripcion_tipo_usuario = $2 WHERE id_tipo_usuario = $3 RETURNING *', [
        tipoUsuario.nombre_tipo_usuario,
        tipoUsuario.descripcion_tipo_usuario || null,
        id
    ]);
    return updatedTipoUsuario.rows[0] || null;
};
exports.updateTipoUsuario = updateTipoUsuario;
exports.default = {
    createTipoUsuario: exports.createTipoUsuario,
    getTiposUsuario: exports.getTiposUsuario,
    deleteTipoUsuario: exports.deleteTipoUsuario,
    updateTipoUsuario: exports.updateTipoUsuario
};
