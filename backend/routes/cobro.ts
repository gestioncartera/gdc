import cobro from '../controllers/cobro';
import express from 'express';

const router = express.Router();

router.post('/createCobro', cobro.createCobro);
router.get('/getAllCobros', cobro.getAllCobros);
router.get('/getCobroById/:cobro_id', cobro.getCobroById);
router.get('/getCobrosByRutaId/:ruta_id', cobro.getCobrosByRutaId);
router.get('/getCobroInfoById/:cobro_id', cobro.getCobroInfoById);
router.get('/getCobrosByPrestamoId/:prestamo_id', cobro.getPrestamoCobrosHistory);
router.put('/updateCobro/:cobro_id', cobro.updateCobro);
router.delete('/deleteCobro/:cobro_id', cobro.deleteCobro);

export default router;