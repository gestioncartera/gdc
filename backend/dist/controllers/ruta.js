"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ruta_1 = __importDefault(require("../models/ruta"));
const AsignacionRuta_1 = __importDefault(require("../models/AsignacionRuta"));
const CajaDiaria_1 = __importDefault(require("../models/CajaDiaria"));
const cliente_1 = __importDefault(require("../models/cliente"));
//crear una nueva ruta
const createRuta = async (req, res) => {
    try {
        if (!req.body.sucursal_id || !req.body.nombre_ruta) {
            return res.status(400).send({ error: 'Faltan datos obligatorios' });
        }
        const nuevaRuta = await ruta_1.default.createRuta(req.body);
        if (!nuevaRuta) {
            return res.status(400).send({ error: 'No se pudo crear la ruta' });
        }
        return res.status(201).send({ message: 'Ruta creada exitosamente' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al crear la ruta' });
    }
};
//obtener todas las rutas de una sucursal
const getRutas = async (req, res) => {
    try {
        const idSucursal = parseInt(req.params.idSucursal);
        const rutas = await ruta_1.default.getRutas(idSucursal);
        return rutas.length === 0
            ? res.status(404).send({ message: 'No se encontraron rutas' })
            : res.status(200).json(rutas);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al obtener la ruta' });
    }
};
//obtener todas las rutas con cobros pendientes de una sucursal
const getRutasCobros = async (req, res) => {
    try {
        const idSucursal = parseInt(req.params.idSucursal);
        const rutas = await ruta_1.default.getRutasCobros(idSucursal);
        return rutas.length === 0
            ? res.status(404).send({ message: 'No se encontraron rutas con cobros pendientes' })
            : res.status(200).json(rutas);
    }
    catch (error) {
        //  console.error(error);
        return res.status(500).send({ error: 'Error al obtener las rutas con cobros pendientes' });
    }
};
//buscar una ruta por ID
const getRutaById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rutaEncontrada = await ruta_1.default.getRutaById(id);
        return rutaEncontrada === null
            ? res.status(404).send({ message: 'Ruta no encontrada' })
            : res.status(200).json(rutaEncontrada);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al obtener las rutas' });
    }
};
//Actualizar una ruta
const updateRuta = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rutaActualizada = await ruta_1.default.updateRuta(id, req.body);
        return rutaActualizada === null
            ? res.status(404).send({ message: 'Ruta no encontrada para actualizar' })
            : res.status(200).send({ message: 'Ruta actualizada exitosamente' });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al actualizar la ruta' });
    }
};
//eliminar una ruta
const deleteRuta = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rutaEliminada = await ruta_1.default.deleteRuta(id);
        return rutaEliminada === null
            ? res.status(404).send({ message: 'Ruta no encontrada para eliminar' })
            : res.status(200).send({ message: 'Ruta eliminada exitosamente' });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al eliminar la ruta' });
    }
};
//DESACTIVAR RUTA
const desactivarRuta = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rutaEncontrada = await ruta_1.default.getRutaById(id);
        if (!rutaEncontrada) {
            return res.status(404).send({ message: 'Ruta no encontrada' });
        }
        const usuarioAsignado = await AsignacionRuta_1.default.getUsuarioAsignadoRuta(id);
        if (usuarioAsignado) {
            const cajaAbierta = await CajaDiaria_1.default.getCajasDiariasByUsuario(usuarioAsignado.usuario_id);
            if (cajaAbierta) {
                return res.status(400).send({ message: 'No se puede desactivar la ruta porque el cobrador tiene una caja abierta' });
            }
        }
        const clientesEnRuta = await cliente_1.default.getClientesByRuta(id);
        if (clientesEnRuta.length > 0) {
            return res.status(400).send({ message: 'No se puede desactivar la ruta porque tiene clientes asignados' });
        }
        const rutaDesactivada = await ruta_1.default.desactivarRuta(id);
        return rutaDesactivada === null
            ? res.status(404).send({ message: 'Ruta no encontrada para desactivar' })
            : res.status(200).send({ message: 'Ruta desactivada exitosamente' });
    }
    catch (error) {
        return res.status(500).send({ error: 'Error al desactivar la ruta' });
    }
};
exports.default = {
    createRuta,
    getRutas,
    getRutaById,
    getRutasCobros,
    updateRuta,
    deleteRuta,
    desactivarRuta
};
