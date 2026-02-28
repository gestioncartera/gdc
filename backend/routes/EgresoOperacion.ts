import EgresoOperacion from "../controllers/EgresoOperacion";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post("/createEgresoOperacion", auth, EgresoOperacion.createEgresoOperacion);
router.get("/getAllEgresosOperacionPendientes/:usuario_id", auth, EgresoOperacion.getAllEgresosOperacionPendientes);
router.delete("/egresooperacion/:id", auth, EgresoOperacion.deleteEgresoOperacion);
router.put("/egresooperacion/:id", auth, EgresoOperacion.updateEgresoOperacion);
router.post("/confirmarEgresosOperacion", auth, EgresoOperacion.confirmarEgresosOperacion);

export default router;
