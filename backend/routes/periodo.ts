import express from "express";
import sucursal from "../controllers/sucursal";
import periodo from "../controllers/periodo";

const router = express.Router();

//routes periodo
router.get('/getPeriodos', periodo.getPeriodos);
router.get('/getPeriodosBySucursal/:sucursal_id', periodo.getPeriodosBySucursal);
router.post('/createPeriodo', periodo.createPeriodo);
router.put('/updatePeriodo/:id', periodo.updatePeriodo);
router.patch('/closePeriodo/:id', periodo.closePeriodo);
router.delete('/deletePeriodo/:id', periodo.deletePeriodo);

export default router;