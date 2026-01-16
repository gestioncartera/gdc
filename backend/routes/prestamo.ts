import prestamo from "../controllers/prestamo";
import express from "express";

const router = express.Router();

router.post("/createPrestamo", prestamo.createPrestamo);
router.get("/getAllPrestamos", prestamo.getAllPrestamos);
router.get("/getPrestamoById/:id", prestamo.getPrestamoById);
router.get("/getPrestamosByCliente/:cliente_id", prestamo.getPrestamosByClienteId);
router.get("/getPrestamosInfo", prestamo.getPrestamosInfo);
router.get("/prestamoCobros/:prestamo_id", prestamo.getPrestamoAndCobrosInfo);
router.put("/updatePrestamo/:id", prestamo.updatePrestamo);
router.delete("/deletePrestamo/:id", prestamo.deletePrestamo);
export default router;