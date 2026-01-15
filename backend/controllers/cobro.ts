import cobro from "../models/cobro";
import prestamo from "../models/prestamo";
import usuario from "../models/usuario";
import { Request, Response } from "express";


// Crear un nuevo cobro
export const createCobro = async (req: Request, res: Response): Promise<Response> => {
  try {
    //validar si el prestamo existe
    const prestamoExistente = await prestamo.getPrestamoById(req.body.prestamo_id);
    if (!prestamoExistente) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    //validar que el cobrador exista
    const cobradorExistente = await usuario.getUsuarioById(req.body.usuario_id);
    if (!cobradorExistente) {
      return res.status(404).json({ error: 'Cobrador no encontrado' });
    }

    //Validar que el cobrador sea el asignado a la ruta del cliente del prestamo
    const cobradorPrestamo= await prestamo.getCobradorByPrestamoId(req.body.prestamo_id);
    //console.log('Cobrador asignado al préstamo:', cobradorPrestamo,req.body.usuario_id);
if(cobradorPrestamo.usuario_id!==req.body.usuario_id){
  return res.status(400).json({ error: 'El usuario no es el cobrador asignado para este préstamo' });
}

    const newCobro = await cobro.createCobro(req.body);
    return (!newCobro) 
    ? res.status(400).send({ error: 'No se pudo crear el cobro' }) 
    : res.status(201).json(newCobro);
  } catch (error) {
    
    return res.status(500).json({ error: 'Error al crear el cobro' });
  }
};

// Obtener todos los cobros
export const getAllCobros = async (req: Request, res: Response): Promise<Response> => {
  try { 
    const cobros = await cobro.getAllCobros();
    return (!cobros ) 
    ? res.status(404).send({ error: 'No existen cobros creados' }) 
    : res.status(200).json(cobros);
  } catch (error) {
   
    return res.status(500).json({ error: 'Error al obtener los cobros' });
  }
};

// Obtener un cobro por ID
export const getCobroById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const cobroById = await cobro.getCobroById(id);
    if (!cobroById) {
      return res.status(404).json({ error: 'Cobro no encontrado' });
    }
    return res.status(200).json(cobroById);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el cobro' });
  } 
};

// Actualizar un cobro
export const updateCobro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id);
    const updatedCobro = await cobro.updateCobro(id, req.body);
    if (!updatedCobro) {
      return res.status(404).json({ error: 'Cobro no encontrado' });
    }
    return res.status(200).json(updatedCobro);
    } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el cobro' });
    }   
};

// Eliminar un cobro
export const deleteCobro = async (req: Request, res: Response): Promise<Response> => {
    try {   
        const id = parseInt(req.params.id); 
        const deletedCobro = await cobro.deleteCobro(id);
        if (!deletedCobro) {
          return res.status(404).json({ error: 'Cobro no encontrado' });
        }
        return res.status(200).json(deletedCobro);
    } catch (error) {       
        return res.status(500).json({ error: 'Error al eliminar el cobro' });
    }
};

export default {
  createCobro,
  getAllCobros,
  getCobroById,
  updateCobro,
  deleteCobro,
};