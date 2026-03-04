import ruta from "../controllers/ruta";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post('/createRuta', auth, ruta.createRuta);
router.get('/getRutas/:idSucursal', auth, ruta.getRutas);
router.get('/getRutaById/:id', auth, ruta.getRutaById);
router.get('/getRutasCobros/:idSucursal', auth, ruta.getRutasCobros);
router.put('/updateRuta/:id', auth, ruta.updateRuta);
router.delete('/deleteRuta/:id', auth, ruta.deleteRuta);
export default router;