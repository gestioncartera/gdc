import TipoPrestamo from "../models/TipoPrestamo";
import { Request, Response } from "express";

// Crear tipo de préstamo
export const createTipoPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (req.body.cantidad_cuotas === undefined || req.body.porcentaje === undefined) {
      return res.status(400).send({ error: 'La cantidad de cuotas y el porcentaje son obligatorios' });
    }
    const tipoPrestamo = req.body;
    const newTipoPrestamo = await TipoPrestamo.createTipoPrestamo(tipoPrestamo);
    return (!newTipoPrestamo) 
    ?  res.status(500).send({ error: 'No se pudo crear el tipo de préstamo' }) 
    : res.status(201).send({ message: 'Tipo de préstamo creado exitosamente' });
  } catch (error) {
    return res.status(500).send({ error: 'Error al crear el tipo de préstamo' });
  }
};

// Obtener todos los tipos de préstamo
export const getTiposPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const tiposPrestamo = await TipoPrestamo.getTiposPrestamo();
    return (!tiposPrestamo )
    ? res.status(500).send({ error: 'No existen tipos de préstamo creados' })
    :res.status(200).json(tiposPrestamo);
  }
    catch (error) {
    return res.status(500).send({ error: 'Error al obtener los tipos de préstamo' });
  }
};

//obtener tipo de prestamo por id
export const getTipoPrestamoById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const tipoPrestamo = await TipoPrestamo.getTipoPrestamoById(id);
    if (tipoPrestamo.length === 0) {
      return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
    }
    return res.status(200).json(tipoPrestamo[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el tipo de préstamo' });
  }
};

//actualizar tipo de préstamo
export const updateTipoPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const tipoPrestamo = req.body;
    const updatedTipoPrestamo = await TipoPrestamo.updateTipoPrestamo(id, tipoPrestamo);
    if (!updatedTipoPrestamo) {
        return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
    }
    return res.status(200).send(updatedTipoPrestamo);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Error al actualizar el tipo de préstamo' });
  } 
};

// Eliminar tipo de préstamo
export const deleteTipoPrestamo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id); 
    const deletedTipoPrestamo = await TipoPrestamo.deleteTipoPrestamo(id);  
    if (!deletedTipoPrestamo) {
      return res.status(404).send({ error: 'Tipo de préstamo no encontrado' });
    }
    return res.status(200).send({ message: 'Tipo de préstamo eliminado exitosamente' });
    } catch (error) {       
    return res.status(500).send({ error: 'Error al eliminar el tipo de préstamo' });
  }
};

export default {
  createTipoPrestamo,
  getTiposPrestamo,
  getTipoPrestamoById,
  updateTipoPrestamo,
  deleteTipoPrestamo
};