import ruta from "../controllers/ruta";
import express from "express";

const router = express.Router();
router.post('/createRuta', ruta.createRuta);
router.get('/getRutas/:idSucursal', ruta.getRutas);
router.get('/getRutaById/:id', ruta.getRutaById);
router.put('/updateRuta/:id', ruta.updateRuta);
router.delete('/deleteRuta/:id', ruta.deleteRuta);
export default router;