import usuario from "../controllers/usuario";
import express from "express";

const router = express.Router();
//routes usuario
router.post('/createUsuario', usuario.createUsuario);
router.get('/getUsuarios', usuario.getUsuarios);
router.get('/getUsuarioById/:id', usuario.getUsuarioById);
router.get('/getUsuarioByDNI/:dni', usuario.getUsuarioByDNI);
router.post('/login', usuario.login);
router.put('/updateUsuario/:id', usuario.updateUsuario);
router.delete('/deleteUsuario/:id', usuario.deleteUsuario);

export default router;