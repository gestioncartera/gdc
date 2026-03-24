"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CajaDiaria_1 = __importDefault(require("../controllers/CajaDiaria"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.post('/abrirCajaDiaria/:sucursal_id', CajaDiaria_1.default.abrirCajaDiaria);
router.get('/getCajasDiarias', auth_1.default, CajaDiaria_1.default.getAllCajasDiarias);
router.get('/getCajaDiariaAbiertaByUsuario/:usuario_id', auth_1.default, CajaDiaria_1.default.getCajaDiariaAbiertaByUsuario);
router.put('/updateCajaDiaria/:id', auth_1.default, CajaDiaria_1.default.updateCajaDiaria);
router.patch('/updateBase/:caja_diaria_id', auth_1.default, CajaDiaria_1.default.updateBase);
router.patch('/cerrarCajaDiaria/:caja_diaria_id', auth_1.default, CajaDiaria_1.default.cerrarCajaDiaria);
router.delete('/deleteCajaDiaria/:id', auth_1.default, CajaDiaria_1.default.getCajaDiariaById);
exports.default = router;
