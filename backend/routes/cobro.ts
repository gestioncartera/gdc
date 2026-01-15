import cobro from '../controllers/cobro';
import express from 'express';

const router = express.Router();

router.post('/createCobro', cobro.createCobro);
router.get('/getAllCobros', cobro.getAllCobros);
router.get('/getCobroById/:id', cobro.getCobroById);
router.get('/getCobrosByRutaId/:ruta_id', cobro.getCobrosByRutaId);
router.put('/updateCobro/:id', cobro.updateCobro);
router.delete('/deleteCobro/:id', cobro.deleteCobro);

export default router;