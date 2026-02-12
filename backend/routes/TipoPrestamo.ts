import TipoPrestamo from "../controllers/TipoPrestamo";
import auth from "../middlewares/auth";
import express from "express";
const router = express.Router();

// Ruta para crear un nuevo tipo de préstamo
router.post("/createTipoPrestamo", auth, TipoPrestamo.createTipoPrestamo);
router.get("/getTipoPrestamo/:sucursal_id", auth, TipoPrestamo.getTiposPrestamo);
router.get("/getTipoPrestamoById/:id", auth, TipoPrestamo.getTipoPrestamoById);
router.put("/updateTipoPrestamo/:id", auth, TipoPrestamo.updateTipoPrestamo);
router.delete("/deleteTipoPrestamo/:id", auth, TipoPrestamo.deleteTipoPrestamo);

export default router;