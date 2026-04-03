import CajaSucursal from "../controllers/CajaSucursal";
import express from "express";
import Admin  from "../middlewares/admin";
import Auth  from "../middlewares/auth";

const router = express.Router();


router.post("/createCajaSucursal",Auth,  CajaSucursal.createCajaSucursal);
router.get("/getCajaSucursal/:sucursal_id",Auth,  CajaSucursal.getAllCajasSucursal);
router.get("/cajaInicialSucursal/:sucursal_id",Auth,  CajaSucursal.cajaInicialSucursal);
router.get("/getGastosSucursal/:sucursal_id",Auth,  CajaSucursal.getGastosSucursal);
router.get("/getSumPrestamosSucursal/:sucursal_id",Auth,  CajaSucursal.getSumPrestamosSucursal);
router.get("/getReporteGastosSucursal/:sucursal_id",Auth,  CajaSucursal.getReporteGastosSucursal);  


export default router;