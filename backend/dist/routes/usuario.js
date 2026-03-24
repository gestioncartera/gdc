"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const usuario_1 = __importDefault(require("../controllers/usuario"));
const express_1 = __importDefault(require("express"));
const admin_1 = __importDefault(require("../middlewares/admin"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
// Ruta pública
router.post('/login', usuario_1.default.login);
//routes usuario
router.post('/createUsuario', auth_1.default, usuario_1.default.createUsuario);
router.get('/getUsuarios/:idSucursal', auth_1.default, admin_1.default, usuario_1.default.getUsuarios);
router.get('/getUsuarioById/:id', auth_1.default, usuario_1.default.getUsuarioById);
router.get('/getUsuarioByDNI/:dni', auth_1.default, usuario_1.default.getUsuarioByDNI);
router.patch('/updatePassword/:id', auth_1.default, usuario_1.default.updatePassword);
router.put('/updateUsuario/:id', auth_1.default, usuario_1.default.updateUsuario);
router.get('/getCobradoresActivos/:idSucursal', auth_1.default, usuario_1.default.getCobradoresActivos);
router.delete('/deleteUsuario/:id', auth_1.default, usuario_1.default.deleteUsuario);
exports.default = router;
