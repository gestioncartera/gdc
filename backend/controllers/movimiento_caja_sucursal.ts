import movtoCajaSucursal from '../models/movimiento_caja_sucursal';
import { Request, Response } from 'express';
import CajaSucursal from '../models/CajaSucursal';
import usuario from '../models/usuario';

const createMovimientoCajaSucursal = async (req: Request, res: Response) => {
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

        const cajaSucursal = await CajaSucursal.getCajaSucursalById(caja_sucursal_id);
        if (!cajaSucursal) {
            return res.status(404).send({ error: 'Caja no encontrada' });
        }

        if (tipo_movimiento === 'egreso' && cajaSucursal.saldo_actual < monto) {
            return res.status(400).send({ error: 'Saldo insuficiente en caja para realizar el egreso' });
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
        
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const anularMovimientoCajaSucursal = async (req: Request, res: Response) => {
    try {
        const movimiento_id = parseInt(req.params.movimiento_id);

        const movimiento = await movtoCajaSucursal.getMovimientoById(movimiento_id);
        if (!movimiento) {
            return res.status(404).send({ error: 'Movimiento no encontrado' });
        }

        if (movimiento.estado_movto === 'anulado') {
            return res.status(400).send({ error: 'El movimiento ya está anulado' });
        }

        const usuarioResponsable= await usuario.esAdmin(movimiento.usuario_responsable_id);
        if (!usuarioResponsable) {
            return res.status(403).send({ error: 'Ete tipo de movimiento no se puede anular' });
        }

        const movimientoAnulado = await movtoCajaSucursal.anularMovimientoCajaSucursal(movimiento_id);

        if (!movimientoAnulado) {
            return res.status(404).send({ error: 'Movimiento no encontrado o es una apertura de caja' });
        }

        return res.status(200).json(movimientoAnulado);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error interno del servidor' });
    }
};

export default {createMovimientoCajaSucursal,
                 getMovimientosByCajaSucursalId, 
                 anularMovimientoCajaSucursal
                };