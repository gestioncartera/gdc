import CajaSucursal from "../models/CajaSucursal";
import sucursal from "../models/sucursal";
import { Request, Response } from "express";

// Crear una nueva caja de sucursal
export const createCajaSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const idsucursal=parseInt(req.body.sucursal_id);
    const existeSucursal = await sucursal.getSucursalById(idsucursal);
    if (!existeSucursal) {
      return res.status(404).send({ message: "Sucursal no encontrada" });
    }
    const existeCajaSucursal = await CajaSucursal.getCajaSucursalBySucursalId(idsucursal);
    if (existeCajaSucursal) {
      return res.status(400).send({ message: "Ya existe una caja para esta sucursal" });
    }

   const newCajaSucursal = await CajaSucursal.createCajaSucursal(req.body);
   if(!newCajaSucursal){
    return res.status(400).send({ message: "Error al crear la caja de sucursal" });
   }    
return res.status(201).json(newCajaSucursal);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al crear la caja de sucursal" });
  }
};

// Obtener todas las cajas de sucursal
 export const getAllCajasSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const idsucursal=parseInt(req.params.sucursalId);
    const cajasSucursal = await CajaSucursal.getCajaSucursalBySucursalId(idsucursal);
    if (!cajasSucursal) {
      return res.status(404).send({ message: "No se encontraron cajas de sucursal" });
    }
    return res.status(200).json(cajasSucursal);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las cajas de sucursal" });
  }
};

export default {
  createCajaSucursal,
  getAllCajasSucursal,
};
