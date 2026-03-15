import prestamo from "../controllers/prestamo";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post("/createPrestamo", auth, prestamo.createPrestamo);
router.get("/getAllPrestamos", auth, prestamo.getAllPrestamos);
router.get("/getPrestamoById/:id", auth, prestamo.getPrestamoById);
router.get("/getPrestamosByCliente/:cliente_id", auth, prestamo.getPrestamosByClienteId);
router.get("/getPrestamosInfo", auth, prestamo.getPrestamosInfo);
router.get("/getPrestamoInfoById/:prestamo_id", auth, prestamo.getPrestamoInfoById);
router.get("/prestamoCobros/:prestamo_id", auth, prestamo.getPrestamoAndCobrosInfo);
router.get("/prestamosPendientes/:sucursal_id", auth, prestamo.PrestamosPendientes);
router.get("/totalCarteraSucursal/:sucursal_id", auth, prestamo.getTotalCarteraSucursal);
router.patch("/updatePrestamo/:id", auth, prestamo.updatePrestamo);
router.delete("/deletePrestamo/:id", auth, prestamo.deletePrestamo);
router.patch("/confirmarPrestamo/:prestamo_id", auth, prestamo.confirmarPrestamo);
router.patch("/rechazarPrestamo/:prestamo_id", auth, prestamo.rechazarPrestamo);

export default router;