"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCajasSucursal = exports.createCajaSucursal = void 0;
const CajaSucursal_1 = __importDefault(require("../models/CajaSucursal"));
const sucursal_1 = __importDefault(require("../models/sucursal"));
// Crear una nueva caja de sucursal
const createCajaSucursal = async (req, res) => {
    try {
        const idsucursal = parseInt(req.body.sucursal_id);
        const existeSucursal = await sucursal_1.default.getSucursalById(idsucursal);
        if (!existeSucursal) {
            return res.status(404).send({ message: "Sucursal no encontrada" });
        }
        const existeCajaSucursal = await CajaSucursal_1.default.getCajaSucursalBySucursalId(idsucursal);
        if (existeCajaSucursal) {
            return res.status(400).send({ message: "Ya existe una caja para esta sucursal" });
        }
        const newCajaSucursal = await CajaSucursal_1.default.createCajaSucursal(req.body);
        if (!newCajaSucursal) {
            return res.status(400).send({ message: "Error al crear la caja de sucursal" });
        }
        return res.status(201).json(newCajaSucursal);
    }
    catch (error) {
        return res.status(500).json({ message: "Error al crear la caja de sucursal" });
    }
};
exports.createCajaSucursal = createCajaSucursal;
// Obtener todas las cajas de sucursal
const getAllCajasSucursal = async (req, res) => {
    try {
        const idsucursal = parseInt(req.params.sucursal_id);
        const cajasSucursal = await CajaSucursal_1.default.getCajaSucursalBySucursalId(idsucursal);
        if (!cajasSucursal) {
            return res.status(404).send({ message: "No se encontraron cajas de sucursal" });
        }
        return res.status(200).json(cajasSucursal);
    }
    catch (error) {
        return res.status(500).json({ message: "Error al obtener la caja de sucursal" });
    }
};
exports.getAllCajasSucursal = getAllCajasSucursal;
exports.default = {
    createCajaSucursal: exports.createCajaSucursal,
    getAllCajasSucursal: exports.getAllCajasSucursal,
};
