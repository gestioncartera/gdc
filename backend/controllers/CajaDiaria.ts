import  CajaDiaria  from "../models/CajaDiaria";
import { Request, Response } from "express";

const createCajaDiaria = async (req: Request, res: Response): Promise<Response> => {
  try {
    const newCajaDiaria = await CajaDiaria.createCajaDiaria(req.body);
    return (!newCajaDiaria) 
    ? res.status(400).send({ error: 'No se pudo crear la caja diaria' }) 
    : res.status(201).json(newCajaDiaria);
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear la caja diaria' });
  }
};

// Obtener todas las cajas diarias
export const getAllCajasDiarias = async (req: Request, res: Response): Promise<Response> => {
  try { 
    const cajasDiarias = await CajaDiaria.getAllCajasDiarias(); 
    return (!cajasDiarias )
    ? res.status(404).send({ error: 'No existen cajas diarias creadas' }) 
    : res.status(200).json(cajasDiarias);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener las cajas diarias' });
  }
};

// Obtener una caja diaria por ID
export const getCajaDiariaById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.caja_diaria_id);
    const cajaDiaria = await CajaDiaria.getCajaDiariaById(id);
    if (!cajaDiaria) {
      return res.status(404).json({ error: 'Caja diaria no encontrada' });
    }
    return res.status(200).json(cajaDiaria);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la caja diaria' });
  }
};

// Obtener cajas diarias por usuario
export const getCajasDiariasByUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    const cajasDiarias = await CajaDiaria.getCajasDiariasByUsuario(usuario_id);
    if (!cajasDiarias) {
      return res.status(404).json({ error: 'No se encontraron cajas diarias para el usuario especificado' });
    }
    return res.status(200).json(cajasDiarias);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener las cajas diarias por usuario' });
  }
};

// Obtener cajas diarias por ruta
export const getCajasDiariasByRuta = async (req: Request, res: Response): Promise<Response> => {
    try {
        const ruta_id = parseInt(req.params.ruta_id);
        const cajasDiarias = await CajaDiaria.getCajasDiariasByRuta(ruta_id);
        if (!cajasDiarias) {
            return res.status(404).json({ error: 'No se encontraron cajas diarias para la ruta especificada' });
        }
        return res.status(200).json(cajasDiarias);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener las cajas diarias por ruta' });
    }
};

// Actualizar caja diaria
export const updateCajaDiaria = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const caja = req.body;
    const updatedCajaDiaria = await CajaDiaria.updateCajaDiaria(id, caja);
    if (!updatedCajaDiaria) {
        return res.status(404).json({ error: 'Caja diaria no encontrada' });
    }
    return res.status(200).json(updatedCajaDiaria);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar la caja diaria' });
  }
};

export default {
  createCajaDiaria,
  getAllCajasDiarias,
  getCajaDiariaById,
  getCajasDiariasByUsuario,
  getCajasDiariasByRuta,
  updateCajaDiaria
};