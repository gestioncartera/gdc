import usuario from "../controllers/usuario";
import express from "express";
import { esAdmin } from "../middlewares/admin";

const router = express.Router();
//routes usuario
router.post('/createUsuario', usuario.createUsuario);
router.get('/getUsuarios/:idSucursal', usuario.getUsuarios);
router.get('/getUsuarioById/:id', usuario.getUsuarioById);
router.get('/getUsuarioByDNI/:dni', usuario.getUsuarioByDNI);
router.post('/login', usuario.login);
router.patch('/updatePassword/:id', usuario.updatePassword);
router.put('/updateUsuario/:id', usuario.updateUsuario);
router.delete('/deleteUsuario/:id', usuario.deleteUsuario);

export default router;