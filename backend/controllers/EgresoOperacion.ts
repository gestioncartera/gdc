import EgresoOperacion from "../models/EgresoOperacion";
import AsignacionRuta from "../models/AsignacionRuta";
import { Request, Response } from "express";

// Crear egreso de operación
export const createEgresoOperacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ruta = await AsignacionRuta.getRutaAsignadaUsuario(req.body.usuario_id); // Obtener la ruta asignada al usuario
    if (!ruta) {
      return res.status(400).send({ error: 'El cobrador no tiene ruta asignada' });
    }
    req.body.ruta_id = ruta.ruta_id; // Agregar la ruta_id al cuerpo de la solicitud para crear el egreso de operación
    const egresoOperacion = req.body;    
    const newEgresoOperacion = await EgresoOperacion.createEgresoOperacion(egresoOperacion);
    return (!newEgresoOperacion) 
    ? res.status(500).send({ error: 'No se pudo crear el egreso de operación' }) 
    : res.status(201).json(newEgresoOperacion);
  } catch (error: any)  {
   

    const erroresNegocio = [
      'No tienes una caja diaria abierta',
      'Fondos insuficientes en caja'
    ];

     const esErrorNegocio = erroresNegocio.some(msg => error.message?.includes(msg));
     if (esErrorNegocio) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).send({ error: 'Error interno del servidor'  });
  }
};

// Obtener todos los egresos de operación pendientes
export const getAllEgresosOperacionPendientes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const  usuario_id   = parseInt(req.params.usuario_id);
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
    console.error(error);
    return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
  }
};

// Obtener egresos pendientes por usuario_id 
export const getEgresosPendientesByUsuarioId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    const egresosOperacion = await EgresoOperacion.getEgresosPendientesByUsuarioId(usuario_id);
    if (!egresosOperacion) {
      return res.status(404).send({ error: 'No se encontraron egresos pendientes para el usuario' });
    }
    return res.status(200).json(egresosOperacion);
  } catch (error) {
    return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
  }
}

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
        return res.status(404).send({ error: 'Egreso de operación no encontrado' });
    }
    return res.status(200).json(updatedEgresoOperacion);
  } catch (error) {
    return res.status(500).send({ error: 'Error al actualizar el egreso de operación' });
  }
};

export const confirmarEgresosOperacion = async (req: Request, res: Response): Promise<Response> => {
  try {

    const  usuario_id = parseInt(req.params.usuario_id);
    if (!usuario_id ) {
      return res.status(400).send({ error: 'Faltan parámetros requeridos' });
    }

    const ruta_id = await AsignacionRuta.getRutaAsignadaUsuario(usuario_id);
    if (!ruta_id) {
      return res.status(404).send({ error: 'No se encontró la ruta asignada al usuario' });
    }

    const asignacion = await AsignacionRuta.isRutaAsignada(ruta_id.ruta_id,usuario_id);
    if (!asignacion) {
      return res.status(404).send({ error: 'No se encontró la ruta asignada al usuario' });
    }
    const egresosOperacion = await EgresoOperacion.confirmarEgresosOperacion(usuario_id, ruta_id.ruta_id);
    if (!egresosOperacion) {
      return res.status(404).send({ error: 'No se encontraron egresos de operación pendientes' });
    }
    return res.status(200).json(egresosOperacion);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Error al confirmar los egresos de operación' });
  }
};

export const getEgresosOperacionCobrador = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    const fecha_apertura = new Date().toLocaleString('en-CA', { timeZone: 'America/Mexico_City' }).replace(',', '');
    const egresosOperacion = await EgresoOperacion.getEgresosOperacionCobrador(usuario_id, fecha_apertura);
    if (!egresosOperacion || egresosOperacion.length === 0) {
      return res.status(404).send({ error: 'No se encontraron egresos de operación' });
    }
    return res.status(200).json(egresosOperacion);
  } catch (error) {
   
    return res.status(500).send({ error: 'Error al obtener los egresos de operación' });
  }
};

export default {
  createEgresoOperacion,
  getAllEgresosOperacionPendientes,
  getEgresosPendientesByUsuarioId,
  getEgresosOperacionCobrador,
  deleteEgresoOperacion,
  updateEgresoOperacion,
  confirmarEgresosOperacion
};
