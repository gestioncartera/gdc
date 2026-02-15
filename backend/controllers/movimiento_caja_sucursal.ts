import movtoCajaSucursal from '../models/movimiento_caja_sucursal';
import { Request, Response } from 'express';

const createMovimientoCajaSucursal = async (req: Request, res: Response) => {
    try {
        const { caja_sucursal_id, usuario_responsable_id, tipo_movimiento, monto, descripcion } = req.body; 
        if (!caja_sucursal_id || !usuario_responsable_id || !tipo_movimiento || !monto || !descripcion) {
            return res.status(400).send({ error: 'Faltan datos obligatorios' });
        }
        const nuevoMovimiento = await movtoCajaSucursal.createMovimientoCajaSucursal(req.body);
        return res.status(201).json(nuevoMovimiento);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const getMovimientosByCajaSucursalId = async (req: Request, res: Response) => {
    try {
        const  caja_sucursal_id  = parseInt(req.params.caja_sucursal_id);
        const movimientos = await movtoCajaSucursal.getMovimientosByCajaSucursalId(caja_sucursal_id);
        return res.status(200).json(movimientos);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};

export default {createMovimientoCajaSucursal, getMovimientosByCajaSucursalId}