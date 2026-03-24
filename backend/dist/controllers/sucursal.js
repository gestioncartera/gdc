"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sucursal_1 = __importDefault(require("../models/sucursal"));
const getSucursalById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const sucursalEncontrada = await sucursal_1.default.getSucursalById(id);
        return sucursalEncontrada === null
            ? res.status(404).send({ message: 'Sucursal no encontrada' })
            : res.status(200).json(sucursalEncontrada);
    }
    catch (error) {
        res.status(500).send({ error: 'Error al obtener la sucursal' });
    }
};
const getSucursalByName = async (req, res) => {
    try {
        const nombre = req.params.nombre;
        const sucursalEncontrada = await sucursal_1.default.getSucursalByName(nombre);
        return sucursalEncontrada === null
            ? res.status(404).send({ message: 'Sucursal no encontrada' })
            : res.status(200).json(sucursalEncontrada);
    }
    catch (error) {
        res.status(500).send({ error: 'Error al obtener la sucursal' });
    }
};
const getSucursales = async (req, res) => {
    try {
        const sucursales = await sucursal_1.default.getSucursales();
        return sucursales.length === 0
            ? res.status(404).send({ message: 'No se encontraron sucursales' })
            : res.status(200).json(sucursales);
        res.json(sucursales);
    }
    catch (error) {
        res.status(500).send({ error: 'Error al obtener las sucursales' });
    }
};
const createSucursal = async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.direccion || req.body.nombre.trim() === '' || req.body.direccion.trim() === '') {
            return res.status(400).send({ error: 'Faltan datos obligatorios' });
        }
        const existeSucursal = await sucursal_1.default.getSucursalByName(req.body.nombre);
        if (existeSucursal) {
            return res.status(409).send({ error: 'Ya existe una sucursal con ese nombre' });
        }
        const nuevaSucursal = await sucursal_1.default.createSucursal(req.body);
        if (!nuevaSucursal || !nuevaSucursal.sucursal_id) {
            return res.status(400).send({ error: 'No se pudo crear la sucursal' });
        }
        return res.status(201).send({
            message: 'Sucursal creada exitosamente (con Caja y Ruta inicial)',
            sucursal: nuevaSucursal
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error al crear la sucursal' });
    }
};
const updateSucursal = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existeSucursal = await sucursal_1.default.getSucursalById(id);
        if (!existeSucursal) {
            return res.status(404).send({ message: 'Sucursal no encontrada' });
        }
        const sucursalActualizada = await sucursal_1.default.updateSucursal(id, req.body);
        return res.status(200).send({ message: 'Sucursal actualizada exitosamente' });
    }
    catch (error) {
        res.status(500).send({ error: 'Error al actualizar la sucursal' });
    }
};
const deleteSucursal = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existeSucursal = await sucursal_1.default.getSucursalById(id);
        if (!existeSucursal) {
            return res.status(404).send({ message: 'Sucursal no encontrada' });
        }
        await sucursal_1.default.deleteSucursal(id);
        return res.status(200).send({ message: 'Sucursal eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).send({ error: 'Error al eliminar la sucursal' });
    }
};
exports.default = {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal
};
