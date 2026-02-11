import TipoPrestamo from "../controllers/TipoPrestamo";
import auth from "../middlewares/auth";
import express from "express";
const router = express.Router();

// Ruta para crear un nuevo tipo de préstamo
router.post("/createTipoPrestamo",  TipoPrestamo.createTipoPrestamo);
router.get("/getTipoPrestamo/:sucursal_id",TipoPrestamo.getTiposPrestamo);
router.get("/getTipoPrestamoById/:id", TipoPrestamo.getTipoPrestamoById);
router.put("/updateTipoPrestamo/:id", TipoPrestamo.updateTipoPrestamo);
router.delete("/deleteTipoPrestamo/:id", TipoPrestamo.deleteTipoPrestamo);

export default router;