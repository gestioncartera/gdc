import movtoCajaSucursal from '../controllers/movimiento_caja_sucursal';
import express from 'express';

const router = express.Router();

router.post('/createmovimiento', movtoCajaSucursal.createMovimientoCajaSucursal);
router.get('/getmovimientos/:caja_sucursal_id/:fecha_inicio/:fecha_fin', movtoCajaSucursal.getMovimientosByCajaSucursalId);
router.patch('/anularmovimiento/:movimiento_id', movtoCajaSucursal.anularMovimientoCajaSucursal);
export default router;