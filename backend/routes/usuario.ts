import usuario from "../controllers/usuario";
import express from "express";
import admin from "../middlewares/admin";
import auth from "../middlewares/auth";

const router = express.Router();

// Ruta pública
router.post('/login', usuario.login);

//routes usuario
router.post('/createUsuario', auth, usuario.createUsuario);
router.get('/getUsuarios/:idSucursal', auth,admin, usuario.getUsuarios);
router.get('/getUsuarioById/:id', auth, usuario.getUsuarioById);
router.get('/getUsuarioByDNI/:dni', auth, usuario.getUsuarioByDNI);
router.patch('/updatePassword/:id', auth, usuario.updatePassword);
router.put('/updateUsuario/:id', auth, usuario.updateUsuario);
router.get('/getCobradoresActivos/:idSucursal', auth, usuario.getCobradoresActivos);
router.delete('/deleteUsuario/:id', auth, usuario.deleteUsuario);

export default router;