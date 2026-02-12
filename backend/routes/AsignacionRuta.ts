import AsignacionesRuta  from "../controllers/AsignacionRuta";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post('/createAsignacionRuta', auth, AsignacionesRuta.createAsignacionRuta);
router.get('/getAsignacionesRuta', auth, AsignacionesRuta.getAsignacionesRuta);
router.put('/updateAsignacionRuta/:id', auth, AsignacionesRuta.updateAsignacionRuta);
router.delete('/deleteAsignacionRuta/:id', auth, AsignacionesRuta.deleteAsignacionRuta);

export default router;  
