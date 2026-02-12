import express from "express";
import sucursal from "../controllers/sucursal";
import auth from "../middlewares/auth";


const router = express.Router();

router.get('/getSucursales', auth, sucursal.getSucursales);
router.get('/getSucursalById/:id', auth, sucursal.getSucursalById);
router.post('/createSucursal', auth, sucursal.createSucursal);
router.put('/updateSucursal/:id', auth, sucursal.updateSucursal);
router.delete('/deleteSucursal/:id', auth, sucursal.deleteSucursal);



export default router;