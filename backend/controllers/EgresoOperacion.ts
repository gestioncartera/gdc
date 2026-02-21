import EgresoOperacion from "../models/EgresoOperacion";
import AsignacionRuta from "../models/AsignacionRuta";
import { Request, Response } from "express";

// Crear egreso de operación
export const createEgresoOperacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    const egresoOperacion = req.body;    
    const newEgresoOperacion = await EgresoOperacion.createEgresoOperacion(egresoOperacion);
    return (!newEgresoOperacion) 
    ? res.status(500).send({ error: 'No se pudo crear el egreso de operación' }) 
    : res.status(201).json(newEgresoOperacion);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Error al crear el egreso de operación' });
  }
};

// Obtener todos los egresos de operación pendientes
export const getAllEgresosOperacionPendientes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const  usuario_id   = parseInt(req.body.usuario_id);
     if (!usuario_id ) {
      return res.status(400).send({ error: 'Faltan parámetros requeridos' });
    }
    const  ruta_id   = await AsignacionRuta.getRutaAsignadaUsuario(usuario_id); // Obtener la ruta asignada al usuario
    if (!ruta_id) {
      return res.status(400).send({ error: 'El cobrador no tiene ruta asignada' });
    }
    const egresosOperacion = await EgresoOperacion.getAllEgresosOperacionPendientes(usuario_id, ruta_id.ruta_id);
    return res.status(200).json(egresosOperacion);
  } catch (error) {
    return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
  }
};

// Eliminar egreso de operación
export const deleteEgresoOperacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id); 
    const deletedEgresoOperacion = await EgresoOperacion.deleteEgresoOperacion(id);
    if (!deletedEgresoOperacion) {
      return res.status(404).json({ error: 'Egreso de operación no encontrado' });
    }   
    return res.status(200).json(deletedEgresoOperacion);
    } catch (error) {       
    return res.status(500).json({ error: 'Error al eliminar el egreso de operación' });
  }
};

// Actualizar egreso de operación
export const updateEgresoOperacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const egresoOperacion = req.body;
    const updatedEgresoOperacion = await EgresoOperacion.updateEgresoOperacion(id, egresoOperacion);
    if (!updatedEgresoOperacion) {
        return res.status(404).json({ error: 'Egreso de operación no encontrado' });
    }
    return res.status(200).json(updatedEgresoOperacion);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el egreso de operación' });
  }
};

export default {
  createEgresoOperacion,
  getAllEgresosOperacionPendientes,
  deleteEgresoOperacion,
  updateEgresoOperacion
};
