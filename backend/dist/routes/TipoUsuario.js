"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TipoUsuario_1 = __importDefault(require("../controllers/TipoUsuario"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.post('/createTipoUsuario', auth_1.default, TipoUsuario_1.default.createTipoUsuario);
router.get('/getTiposUsuario', auth_1.default, TipoUsuario_1.default.getTiposUsuario);
router.put('/updateTipoUsuario/:id', auth_1.default, TipoUsuario_1.default.updateTipoUsuario);
router.delete('/deleteTipoUsuario/:id', auth_1.default, TipoUsuario_1.default.deleteTipoUsuario);
exports.default = router;
