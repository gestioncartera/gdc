import prestamo from "../controllers/prestamo";
import express from "express";

const router = express.Router();

router.post("/prestamo", prestamo.createPrestamo);
router.get("/prestamo", prestamo.getAllPrestamos);
router.get("/prestamo/:id", prestamo.getPrestamoById);
router.get("/getPrestamosByCliente/:cliente_id", prestamo.getPrestamosByClienteId);
router.get("/prestamoCobros/:prestamo_id", prestamo.getPrestamoAndCobrosInfo);
router.put("/prestamo/:id", prestamo.updatePrestamo);
router.delete("/prestamo/:id", prestamo.deletePrestamo);
export default router;