import GastoOperacion from "../controllers/GastoOperacion";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post("/gastooperacion", auth, GastoOperacion.createGastoOperacion);
router.get("/gastooperacion", auth, GastoOperacion.getAllGastosOperacion);
router.delete("/gastooperacion/:id", auth, GastoOperacion.deleteGastoOperacion);
router.put("/gastooperacion/:id", auth, GastoOperacion.updateGastoOperacion);

export default router;