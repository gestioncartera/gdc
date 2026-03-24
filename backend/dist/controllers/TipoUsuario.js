"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTipoUsuario = exports.deleteTipoUsuario = exports.getTiposUsuario = exports.createTipoUsuario = void 0;
const TipoUsuario_1 = __importDefault(require("../models/TipoUsuario"));
// Crear tipo de usuario
const createTipoUsuario = async (req, res) => {
    try {
        if (!req.body.nombre_tipo_usuario) {
            return res.status(400).json({ error: 'El nombre del tipo de usuario es obligatorio' });
        }
        const tipoUsuario = req.body;
        const newTipoUsuario = await TipoUsuario_1.default.createTipoUsuario(tipoUsuario);
        return (!newTipoUsuario)
            ? res.status(500).json({ error: 'No se pudo crear el tipo de usuario' })
            : res.status(201).send({ message: 'Tipo de usuario creado exitosamente' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al crear el tipo de usuario' });
    }
};
exports.createTipoUsuario = createTipoUsuario;
// Obtener todos los tipos de usuario
const getTiposUsuario = async (req, res) => {
    try {
        const tiposUsuario = await TipoUsuario_1.default.getTiposUsuario();
        return res.status(200).json(tiposUsuario);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener los tipos de usuario' });
    }
};
exports.getTiposUsuario = getTiposUsuario;
// Eliminar tipo de usuario
const deleteTipoUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedTipoUsuario = await TipoUsuario_1.default.deleteTipoUsuario(id);
        if (!deletedTipoUsuario) {
            return res.status(404).json({ error: 'Tipo de usuario no encontrado' });
        }
        return res.status(200).json(deletedTipoUsuario);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al eliminar el tipo de usuario' });
    }
};
exports.deleteTipoUsuario = deleteTipoUsuario;
// Actualizar tipo de usuario
const updateTipoUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tipoUsuario = req.body;
        const updatedTipoUsuario = await TipoUsuario_1.default.updateTipoUsuario(id, tipoUsuario);
        if (!updatedTipoUsuario) {
            return res.status(404).json({ error: 'Tipo de usuario no encontrado' });
        }
        return res.status(200).json(updatedTipoUsuario);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al actualizar el tipo de usuario' });
    }
};
exports.updateTipoUsuario = updateTipoUsuario;
exports.default = {
    createTipoUsuario: exports.createTipoUsuario,
    getTiposUsuario: exports.getTiposUsuario,
    deleteTipoUsuario: exports.deleteTipoUsuario,
    updateTipoUsuario: exports.updateTipoUsuario
};
