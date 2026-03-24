"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmarEgresosOperacion = exports.updateEgresoOperacion = exports.deleteEgresoOperacion = exports.getEgresosPendientesByUsuarioId = exports.getAllEgresosOperacionPendientes = exports.createEgresoOperacion = void 0;
const EgresoOperacion_1 = __importDefault(require("../models/EgresoOperacion"));
const AsignacionRuta_1 = __importDefault(require("../models/AsignacionRuta"));
// Crear egreso de operación
const createEgresoOperacion = async (req, res) => {
    try {
        const ruta = await AsignacionRuta_1.default.getRutaAsignadaUsuario(req.body.usuario_id); // Obtener la ruta asignada al usuario
        if (!ruta) {
            return res.status(400).send({ error: 'El cobrador no tiene ruta asignada' });
        }
        req.body.ruta_id = ruta.ruta_id; // Agregar la ruta_id al cuerpo de la solicitud para crear el egreso de operación
        const egresoOperacion = req.body;
        const newEgresoOperacion = await EgresoOperacion_1.default.createEgresoOperacion(egresoOperacion);
        return (!newEgresoOperacion)
            ? res.status(500).send({ error: 'No se pudo crear el egreso de operación' })
            : res.status(201).json(newEgresoOperacion);
    }
    catch (error) {
        const erroresNegocio = [
            'No tienes una caja diaria abierta',
            'Fondos insuficientes en caja'
        ];
        const esErrorNegocio = erroresNegocio.some(msg => error.message?.includes(msg));
        if (esErrorNegocio) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};
exports.createEgresoOperacion = createEgresoOperacion;
// Obtener todos los egresos de operación pendientes
const getAllEgresosOperacionPendientes = async (req, res) => {
    try {
        const usuario_id = parseInt(req.params.usuario_id);
        if (!usuario_id) {
            return res.status(400).send({ error: 'Faltan parámetros requeridos' });
        }
        const ruta_id = await AsignacionRuta_1.default.getRutaAsignadaUsuario(usuario_id); // Obtener la ruta asignada al usuario
        if (!ruta_id) {
            return res.status(400).send({ error: 'El cobrador no tiene ruta asignada' });
        }
        const egresosOperacion = await EgresoOperacion_1.default.getAllEgresosOperacionPendientes(usuario_id, ruta_id.ruta_id);
        return res.status(200).json(egresosOperacion);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
    }
};
exports.getAllEgresosOperacionPendientes = getAllEgresosOperacionPendientes;
// Obtener egresos pendientes por usuario_id 
const getEgresosPendientesByUsuarioId = async (req, res) => {
    try {
        const usuario_id = parseInt(req.params.usuario_id);
        const egresosOperacion = await EgresoOperacion_1.default.getEgresosPendientesByUsuarioId(usuario_id);
        if (!egresosOperacion) {
            return res.status(404).send({ error: 'No se encontraron egresos pendientes para el usuario' });
        }
        return res.status(200).json(egresosOperacion);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
    }
};
exports.getEgresosPendientesByUsuarioId = getEgresosPendientesByUsuarioId;
// Eliminar egreso de operación
const deleteEgresoOperacion = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedEgresoOperacion = await EgresoOperacion_1.default.deleteEgresoOperacion(id);
        if (!deletedEgresoOperacion) {
            return res.status(404).json({ error: 'Egreso de operación no encontrado' });
        }
        return res.status(200).json(deletedEgresoOperacion);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al eliminar el egreso de operación' });
    }
};
exports.deleteEgresoOperacion = deleteEgresoOperacion;
// Actualizar egreso de operación
const updateEgresoOperacion = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const egresoOperacion = req.body;
        const updatedEgresoOperacion = await EgresoOperacion_1.default.updateEgresoOperacion(id, egresoOperacion);
        if (!updatedEgresoOperacion) {
            return res.status(404).send({ error: 'Egreso de operación no encontrado' });
        }
        return res.status(200).json(updatedEgresoOperacion);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al actualizar el egreso de operación' });
    }
};
exports.updateEgresoOperacion = updateEgresoOperacion;
const confirmarEgresosOperacion = async (req, res) => {
    try {
        const usuario_id = parseInt(req.params.usuario_id);
        if (!usuario_id) {
            return res.status(400).send({ error: 'Faltan parámetros requeridos' });
        }
        const ruta_id = await AsignacionRuta_1.default.getRutaAsignadaUsuario(usuario_id);
        if (!ruta_id) {
            return res.status(404).send({ error: 'No se encontró la ruta asignada al usuario' });
        }
        const asignacion = await AsignacionRuta_1.default.isRutaAsignada(ruta_id.ruta_id, usuario_id);
        if (!asignacion) {
            return res.status(404).send({ error: 'No se encontró la ruta asignada al usuario' });
        }
        const egresosOperacion = await EgresoOperacion_1.default.confirmarEgresosOperacion(usuario_id, ruta_id.ruta_id);
        if (!egresosOperacion) {
            return res.status(404).send({ error: 'No se encontraron egresos de operación pendientes' });
        }
        return res.status(200).json(egresosOperacion);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al confirmar los egresos de operación' });
    }
};
exports.confirmarEgresosOperacion = confirmarEgresosOperacion;
exports.default = {
    createEgresoOperacion: exports.createEgresoOperacion,
    getAllEgresosOperacionPendientes: exports.getAllEgresosOperacionPendientes,
    getEgresosPendientesByUsuarioId: exports.getEgresosPendientesByUsuarioId,
    deleteEgresoOperacion: exports.deleteEgresoOperacion,
    updateEgresoOperacion: exports.updateEgresoOperacion,
    confirmarEgresosOperacion: exports.confirmarEgresosOperacion
};
