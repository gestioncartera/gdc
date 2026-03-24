"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAsignacionRuta = exports.deleteAsignacionRuta = exports.getAsignacionesRuta = exports.createAsignacionRuta = void 0;
const AsignacionRuta_1 = __importDefault(require("../models/AsignacionRuta"));
const CajaDiaria_1 = __importDefault(require("../models/CajaDiaria"));
// Crear asignación de ruta
const createAsignacionRuta = async (req, res) => {
    try {
        // Verificar si YA tienen exactamente esa asignación activa 
        const existeRutaAsignada = await AsignacionRuta_1.default.isRutaAsignada(req.body.ruta_id, req.body.usuario_id);
        if (existeRutaAsignada) {
            // Devolver error o mensaje de que ya está lista
            return res.status(400).send({ error: 'La ruta ya está asignada a este usuario' });
        }
        //Validar que cobrador no tenga caja abierta
        const cajaAbierta = await CajaDiaria_1.default.getCajasDiariasByUsuario(req.body.usuario_id);
        if (cajaAbierta && cajaAbierta.length > 0) {
            return res.status(400).send({ error: 'El usuario tiene una caja abierta, cierre la caja antes de asignar una nueva ruta' });
        }
        //validar que ruta no tenga asociada una caja abierta
        const cajaAbiertaRuta = await CajaDiaria_1.default.getCajasDiariasByRuta(req.body.ruta_id);
        if (cajaAbiertaRuta && cajaAbiertaRuta.length > 0) {
            return res.status(400).send({ error: 'La ruta tiene una caja abierta, cierre la caja antes de asignar la ruta' });
        }
        // Usar la transacción segura del modelo para limpiar conflictos y crear
        const newAsignacionRuta = await AsignacionRuta_1.default.asignarRutaSegura(req.body);
        return res.status(201).json(newAsignacionRuta);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al crear la asignación de ruta' });
    }
};
exports.createAsignacionRuta = createAsignacionRuta;
// Obtener todas las asignaciones de ruta
const getAsignacionesRuta = async (req, res) => {
    try {
        const asignacionesRuta = await AsignacionRuta_1.default.getAsignacionesRuta();
        return (!asignacionesRuta)
            ? res.status(500).send({ error: 'No existen asignaciones de ruta creadas' })
            : res.status(200).json(asignacionesRuta);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener las asignaciones de ruta' });
    }
};
exports.getAsignacionesRuta = getAsignacionesRuta;
// Eliminar asignación de ruta
const deleteAsignacionRuta = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedAsignacionRuta = await AsignacionRuta_1.default.deleteAsignacionRuta(id);
        if (!deletedAsignacionRuta) {
            return res.status(404).json({ error: 'Asignación de ruta no encontrada' });
        }
        return res.status(200).json(deletedAsignacionRuta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al eliminar la asignación de ruta' });
    }
};
exports.deleteAsignacionRuta = deleteAsignacionRuta;
// Actualizar asignación de ruta
const updateAsignacionRuta = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const asignacionRuta = req.body;
        const updatedAsignacionRuta = await AsignacionRuta_1.default.updateAsignacionRuta(id, asignacionRuta);
        if (!updatedAsignacionRuta) {
            return res.status(404).json({ error: 'Asignación de ruta no encontrada' });
        }
        return res.status(200).json(updatedAsignacionRuta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al actualizar la asignación de ruta' });
    }
};
exports.updateAsignacionRuta = updateAsignacionRuta;
exports.default = {
    createAsignacionRuta: exports.createAsignacionRuta,
    getAsignacionesRuta: exports.getAsignacionesRuta,
    deleteAsignacionRuta: exports.deleteAsignacionRuta,
    updateAsignacionRuta: exports.updateAsignacionRuta
};
