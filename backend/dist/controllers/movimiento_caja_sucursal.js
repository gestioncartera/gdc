"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const movimiento_caja_sucursal_1 = __importDefault(require("../models/movimiento_caja_sucursal"));
const CajaSucursal_1 = __importDefault(require("../models/CajaSucursal"));
const usuario_1 = __importDefault(require("../models/usuario"));
const createMovimientoCajaSucursal = async (req, res) => {
    try {
        const { caja_sucursal_id, usuario_responsable_id, tipo_movimiento, monto, descripcion } = req.body;
        if (!caja_sucursal_id || !usuario_responsable_id || !tipo_movimiento || !monto || !descripcion) {
            return res.status(400).send({ error: 'Faltan datos obligatorios' });
        }
        if (tipo_movimiento !== 'ingreso' && tipo_movimiento !== 'egreso') {
            return res.status(400).send({ error: 'Tipo de movimiento inválido' });
        }
        if (monto <= 0) {
            return res.status(400).send({ error: 'El monto debe ser mayor a cero' });
        }
        const cajaSucursal = await CajaSucursal_1.default.getCajaSucursalById(caja_sucursal_id);
        if (!cajaSucursal) {
            return res.status(404).send({ error: 'Caja no encontrada' });
        }
        if (tipo_movimiento === 'egreso' && cajaSucursal.saldo_actual < monto) {
            return res.status(400).send({ error: 'Saldo insuficiente en caja para realizar el egreso' });
        }
        const nuevoMovimiento = await movimiento_caja_sucursal_1.default.createMovimientoCajaSucursal(req.body);
        return res.status(201).json(nuevoMovimiento);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};
const getMovimientosByCajaSucursalId = async (req, res) => {
    try {
        const caja_sucursal_id = parseInt(req.params.caja_sucursal_id);
        const movimientos = await movimiento_caja_sucursal_1.default.getMovimientosByCajaSucursalId(caja_sucursal_id);
        return res.status(200).json(movimientos);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};
const anularMovimientoCajaSucursal = async (req, res) => {
    try {
        const movimiento_id = parseInt(req.params.movimiento_id);
        const movimiento = await movimiento_caja_sucursal_1.default.getMovimientoById(movimiento_id);
        if (!movimiento) {
            return res.status(404).send({ error: 'Movimiento no encontrado' });
        }
        if (movimiento.estado_movto === 'anulado') {
            return res.status(400).send({ error: 'El movimiento ya está anulado' });
        }
        const usuarioResponsable = await usuario_1.default.esAdmin(movimiento.usuario_responsable_id);
        if (!usuarioResponsable) {
            return res.status(403).send({ error: 'Este tipo de movimiento no se puede anular' });
        }
        if (movimiento.tipo_movimiento.toLowerCase() === 'ingreso') {
            const hayEgresos = await movimiento_caja_sucursal_1.default.hayEgresosNew(movimiento);
            if (hayEgresos) {
                return res.status(403).send({ error: 'No se puede anular un movimiento de ingreso si hay egresos posteriores' });
            }
        }
        const movimientoAnulado = await movimiento_caja_sucursal_1.default.anularMovimientoCajaSucursal(movimiento_id);
        if (!movimientoAnulado) {
            return res.status(404).send({ error: 'Movimiento no encontrado o es una apertura de caja' });
        }
        return res.status(200).json(movimientoAnulado);
    }
    catch (error) {
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};
exports.default = { createMovimientoCajaSucursal,
    getMovimientosByCajaSucursalId,
    anularMovimientoCajaSucursal
};
