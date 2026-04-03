import TipoUsuario from "../controllers/TipoUsuario";
import express from "express";
import auth from "../middlewares/auth";

const router = express.Router();

router.post('/createTipoUsuario', auth, TipoUsuario.createTipoUsuario);
router.get('/getTiposUsuario', auth, TipoUsuario.getTiposUsuario);
router.put('/updateTipoUsuario/:id', auth, TipoUsuario.updateTipoUsuario);
router.delete('/deleteTipoUsuario/:id', auth, TipoUsuario.deleteTipoUsuario);

export default router;