import CajaDiaria from "../controllers/CajaDiaria";
import express from "express";
import auth from "../middlewares/auth";
const router = express.Router();

router.post('/abrirCajaDiaria/:sucursal_id', CajaDiaria.abrirCajaDiaria);
router.get('/getCajasDiarias', auth, CajaDiaria.getAllCajasDiarias);
router.put('/updateCajaDiaria/:id', auth, CajaDiaria.updateCajaDiaria);
router.delete('/deleteCajaDiaria/:id', auth, CajaDiaria.getCajaDiariaById);

export default router;