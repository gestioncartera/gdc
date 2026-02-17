import CajaSucursal from "../controllers/CajaSucursal";
import express from "express";
import Admin  from "../middlewares/admin";
import Auth  from "../middlewares/auth";

const router = express.Router();


router.post("/createCajaSucursal",  CajaSucursal.createCajaSucursal);
router.get("/getCajaSucursal/:sucursal_id",  CajaSucursal.getAllCajasSucursal);


export default router;