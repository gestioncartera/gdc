import periodo from '../models/periodo';
import sucursal from '../models/sucursal';
import prestamo from '../models/prestamo';
import { Request, Response } from 'express';  

//obtener todos los periodos
const getPeriodos = async (req: Request, res: Response) => {
  try {
    const periodos = await periodo.getPeriodos();
    return periodos.length===0
    ? res.status(404).send({ message: 'No se encontraron periodos' })
    : res.status(200).json(periodos);  
  } catch (error) {
    res.status(500).send({ error: 'Error al obtener los periodos' });
  }
};

const   getPeriodoById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const periodoEncontrado = await periodo.getPeriodoById(id);  
          return periodoEncontrado===null
          ? res.status(404).send({ message: 'Periodo no encontrado' }) 
          : res.status(200).json(periodoEncontrado);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener el periodo' });
    }
};

//Obtener periodo por sucursal
const getPeriodosBySucursal = async (req: Request, res: Response) => {
    try { 
        const sucursal_id = parseInt(req.params.sucursal_id);
        const existeSucursal = await sucursal.getSucursalById(sucursal_id);  
            if (!existeSucursal) {
              return res.status(404).send({ Error: 'La sucursal no existe' });
            }
        const periodoEncontrado = await periodo.getPeriodosBySucursal(sucursal_id);
          return periodoEncontrado===null
          ? res.status(404).send({ message: 'Periodo no encontrado para la sucursal' }) 
          : res.status(200).json(periodoEncontrado);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener el periodo' });
    }
};

//crear un nuevo periodo
const createPeriodo = async (req: Request, res: Response) => {
  try {
    if (!req.body.sucursal_id || !req.body.fecha_inicio || !req.body.capital_inicial) {
       return res.status(400).send({ error: 'Faltan datos obligatorios' });         
    }
    const nuevoPeriodo = await periodo.createPeriodo(req.body);
    console.log(nuevoPeriodo);
    return (!nuevoPeriodo) 
    ? res.status(201).send({ message: 'Periodo creado exitosamente' })
    : res.status(400).send({ error: 'Error al crear el periodo' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Error al crear el periodo' });
  }
};

//Update periodo 
const updatePeriodo = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const periodoActualizado = await periodo.updatePeriodo(id, req.body);
        const existePeriodo = await periodo.getPeriodoById(id);
        if (!existePeriodo) {
            return res.status(404).send({ error: 'Periodo no encontrado' });
        }
        const existeSucursal = await sucursal.getSucursalById(id);  
            if (!existeSucursal) {
              return res.status(404).send({ Error: 'La sucursal no existe' });
            }

        return (!periodoActualizado) 
        ? res.status(200).send({ message: 'Periodo actualizado exitosamente' })
        : res.status(400).send({ error: 'Error al actualizar el periodo' });
    } catch (error) {
        res.status(500).send({ error: 'Error al actualizar el periodo' });
    }
};

//eliminar periodo
const deletePeriodo = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const existePeriodo = await periodo.getPeriodoById(id);  
        if (!existePeriodo) {
            return res.status(404).send({ message: 'Periodo no encontrado' });
        }

        // Validar si tiene préstamos asociados
        const cantidadPrestamos = await prestamo.countPrestamosByPeriodo(id);
        if (cantidadPrestamos > 0) {
            return res.status(400).send({ 
                error: 'No se puede eliminar el periodo porque tiene préstamos asociados. Considere cerrarlo en su lugar.' 
            });
        }

        await periodo.deletePeriodo(id);
        return res.status(200).send({message: 'Periodo eliminado exitosamente' });
    } catch (error) {
        
        res.status(500).send({ error: 'Error al eliminar el periodo' });
    }
};

//Cerrar periodo
const closePeriodo = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const periodoExistente = await periodo.getPeriodoById(id);
        if (!periodoExistente) {
            return res.status(404).send({ error: 'Periodo no encontrado' });
        }

        const periodoCerrado = await periodo.closePeriodo(id);
        return periodoCerrado
            ? res.status(200).send({ message: 'Periodo cerrado exitosamente' })
            : res.status(400).send({ error: 'Error al cerrar el periodo tiene prestamos en curso' });
    } catch (error) {
        res.status(500).send({ error: 'Error al cerrar el periodo' });
    }
};

export default {
  getPeriodos,
  getPeriodosBySucursal,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
  closePeriodo
};