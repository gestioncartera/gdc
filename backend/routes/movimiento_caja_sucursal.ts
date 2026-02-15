import movtoCajaSucursal from '../controllers/movimiento_caja_sucursal';
import express from 'express';

const router = express.Router();

router.post('/createmovimiento', movtoCajaSucursal.createMovimientoCajaSucursal);
router.get('/getmovimientos/:caja_sucursal_id', movtoCajaSucursal.getMovimientosByCajaSucursalId);
export default router;