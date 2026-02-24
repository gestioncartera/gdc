import CajaDiaria from "../controllers/CajaDiaria";
import express from "express";
import auth from "../middlewares/auth";
const router = express.Router();

router.post('/abrirCajaDiaria/:sucursal_id', CajaDiaria.abrirCajaDiaria);
router.get('/getCajasDiarias', auth, CajaDiaria.getAllCajasDiarias);
router.get('/getCajaDiariaAbiertaByUsuario/:usuario_id', auth, CajaDiaria.getCajaDiariaAbiertaByUsuario);
router.put('/updateCajaDiaria/:id', auth, CajaDiaria.updateCajaDiaria);
router.patch('/updateBase/:caja_diaria_id', auth, CajaDiaria.updateBase);
router.delete('/deleteCajaDiaria/:id', auth, CajaDiaria.getCajaDiariaById);

export default router;