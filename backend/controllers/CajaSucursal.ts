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
    
    return res.status(500).json({ message: "Error al crear la caja de sucursal" });
  }
};

// Obtener todas las cajas de sucursal
 export const getAllCajasSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const idsucursal=parseInt(req.params.sucursal_id);
    const cajasSucursal = await CajaSucursal.getCajaSucursalBySucursalId(idsucursal);
    if (!cajasSucursal) {
      return res.status(404).send({ message: "No se encontraron cajas de sucursal" });
    }
    return res.status(200).json(cajasSucursal);
  } catch (error) {
    
    return res.status(500).json({ message: "Error al obtener la caja de sucursal" });
  }
};

export const cajaInicialSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const idsucursal=parseInt(req.params.sucursal_id);
    const saldoInicial = await CajaSucursal.cajaInicialSucursal(idsucursal);
    if (!saldoInicial) {
      return res.status(404).send({ message: "No se encontró el saldo inicial de la caja de sucursal" });
    }
    return res.status(200).json(saldoInicial);
  } catch (error) {
    console.log(error);
    
    return res.status(500).send({ message: "Error al obtener el saldo inicial de la caja de sucursal" });
  }
};

export default {
  createCajaSucursal,
  getAllCajasSucursal,
  cajaInicialSucursal
};
