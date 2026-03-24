import cobro from '../controllers/cobro';
import express from 'express';
import auth from "../middlewares/auth";

const router = express.Router();

router.post('/createCobro', auth, cobro.createCobro);
router.get('/getAllCobros', auth, cobro.getAllCobros);
router.get('/getCobroById/:cobro_id', auth, cobro.getCobroById);
router.get('/getCobrosByRutaId/:ruta_id', auth, cobro.getCobrosByRutaId);
router.get('/getCobroInfoById/:cobro_id', auth, cobro.getCobroInfoById);
router.get('/getCobrosByPrestamoId/:prestamo_id', auth, cobro.getPrestamoCobrosHistory);
router.get('/getTotalCobradoHoy/:sucursal_id', auth, cobro.getTotalCobradoHoy);
router.get('/getCantCobrosHoy/:sucursal_id', auth, cobro.getCantCobrosHoy);
router.get('/resumenCobrosCoradorRuta/:sucursal_id', auth, cobro.resumenCobrosCoradorRuta);
router.patch('/updateMontoCobroConCaja/:cobro_id', auth, cobro.updateMontoCobroConCaja);
//router.put('/updateCobro/:cobro_id', auth, cobro.updateCobro);
router.delete('/deleteCobro/:cobro_id', auth, cobro.deleteCobro);
router.patch('/validarMultiplesCobros', auth, cobro.validarMultiplesCobros);

export default router;