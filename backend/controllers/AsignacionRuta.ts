import AsignacionRuta from "../models/AsignacionRuta";
import { Request, Response } from "express";
import CajaDiaria from "../models/CajaDiaria";

// Crear asignación de ruta
export const createAsignacionRuta = async (req: Request, res: Response): Promise<Response> => {
  try {
     
    // Verificar si YA tienen exactamente esa asignación activa 
    const existeRutaAsignada = await AsignacionRuta.isRutaAsignada(req.body.ruta_id, req.body.usuario_id);
    if (existeRutaAsignada) {
       // Devolver error o mensaje de que ya está lista
      return res.status(400).send({ error: 'La ruta ya está asignada a este usuario' });
    }

    //Validar que cobrador no tenga caja abierta
    const cajaAbierta= await  CajaDiaria.getCajasDiariasByUsuario(req.body.usuario_id);
    if(cajaAbierta && cajaAbierta.length > 0){
      return res.status(400).send({ error: 'El usuario tiene una caja abierta, cierre la caja antes de asignar una nueva ruta' });
    }

    //validar que ruta no tenga asociada una caja abierta
    const cajaAbiertaRuta= await  CajaDiaria.getCajasDiariasByRuta(req.body.ruta_id);
    if(cajaAbiertaRuta && cajaAbiertaRuta.length > 0){
      return res.status(400).send({ error: 'La ruta tiene una caja abierta, cierre la caja antes de asignar la ruta' });
    }

    // Usar la transacción segura del modelo para limpiar conflictos y crear
    const newAsignacionRuta = await AsignacionRuta.asignarRutaSegura(req.body);

    return res.status(201).json(newAsignacionRuta);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Error al crear la asignación de ruta' });
  }
};

// Obtener todas las asignaciones de ruta
export const getAsignacionesRuta = async (req: Request, res: Response): Promise<Response> => {
  try {
    const asignacionesRuta = await AsignacionRuta.getAsignacionesRuta();
    return (!asignacionesRuta )
    ? res.status(500).send({ error: 'No existen asignaciones de ruta creadas' })
    :res.status(200).json(asignacionesRuta);
  } catch (error) {
    return res.status(500).send({ error: 'Error al obtener las asignaciones de ruta' });
  }
};

// Eliminar asignación de ruta
export const deleteAsignacionRuta = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id); 
    const deletedAsignacionRuta = await AsignacionRuta.deleteAsignacionRuta(id);
    if (!deletedAsignacionRuta) {
      return res.status(404).json({ error: 'Asignación de ruta no encontrada' });
    }
    return res.status(200).json(deletedAsignacionRuta);
    } catch (error) {       
    return res.status(500).json({ error: 'Error al eliminar la asignación de ruta' });
  }
};

// Actualizar asignación de ruta
export const updateAsignacionRuta = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const asignacionRuta = req.body;
    const updatedAsignacionRuta = await AsignacionRuta.updateAsignacionRuta(id, asignacionRuta);
    if (!updatedAsignacionRuta) {
        return res.status(404).json({ error: 'Asignación de ruta no encontrada' });
    }
    return res.status(200).json(updatedAsignacionRuta);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar la asignación de ruta' });
  }
};

export default {
  createAsignacionRuta,
  getAsignacionesRuta,
  deleteAsignacionRuta,
  updateAsignacionRuta
};