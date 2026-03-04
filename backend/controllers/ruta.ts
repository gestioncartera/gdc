import ruta from "../models/ruta";
import { Request, Response } from "express";

//crear una nueva ruta
const createRuta =async (req: Request, res: Response) => {
    try {
        if (!req.body.sucursal_id || !req.body.nombre_ruta) {
            return res.status(400).send({ error: 'Faltan datos obligatorios' });         
        }
        const nuevaRuta = await ruta.createRuta(req.body);
        if (!nuevaRuta) {
             return res.status(400).send({ error: 'No se pudo crear la ruta' });
        }
         return res.status(201).send({ message: 'Ruta creada exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error al crear la ruta' });
    }
};

//obtener todas las rutas
const getRutas = async (req: Request, res: Response) => {
    try {
        const idSucursal = parseInt(req.params.idSucursal);
      const rutas = await ruta.getRutas(idSucursal);    
        return  rutas.length === 0
        ? res.status(404).send({ message: 'No se encontraron rutas' })
        : res.status(200).json(rutas);
    } catch (error) {
        
        return res.status(500).send({ error: 'Error al obtener la ruta' });
    }
};

//buscar una ruta por ID
const getRutaById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const rutaEncontrada = await ruta.getRutaById(id);  
          return rutaEncontrada===null
          ? res.status(404).send({ message: 'Ruta no encontrada' }) 
          : res.status(200).json(rutaEncontrada);
    } catch (error) {
       console.error(error);
        return res.status(500).send({ error: 'Error al obtener las rutas' });
    }
};

//Actualizar una ruta
const updateRuta = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const rutaActualizada = await ruta.updateRuta(id, req.body);
          return rutaActualizada===null
          ? res.status(404).send({ message: 'Ruta no encontrada para actualizar' }) 
          :  res.status(200).send({ message: 'Ruta actualizada exitosamente' });
    } catch (error) {
        return res.status(500).send({ error: 'Error al actualizar la ruta' });
    }
};

//eliminar una ruta
const deleteRuta = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const rutaEliminada = await ruta.deleteRuta(id);
          return rutaEliminada===null
          ? res.status(404).send({ message: 'Ruta no encontrada para eliminar' }) 
          :  res.status(200).send({ message: 'Ruta eliminada exitosamente' });
    } catch (error) {
        return res.status(500).send({ error: 'Error al eliminar la ruta' });
    }
};


export default{
  createRuta,
  getRutas,
  getRutaById,
  updateRuta,
    deleteRuta
};