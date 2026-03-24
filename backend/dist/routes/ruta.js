"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ruta_1 = __importDefault(require("../controllers/ruta"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.post('/createRuta', auth_1.default, ruta_1.default.createRuta);
router.get('/getRutas/:idSucursal', auth_1.default, ruta_1.default.getRutas);
router.get('/getRutaById/:id', auth_1.default, ruta_1.default.getRutaById);
router.get('/getRutasCobros/:idSucursal', auth_1.default, ruta_1.default.getRutasCobros);
router.put('/updateRuta/:id', auth_1.default, ruta_1.default.updateRuta);
router.patch('/desactivarRuta/:id', auth_1.default, ruta_1.default.desactivarRuta);
router.delete('/deleteRuta/:id', auth_1.default, ruta_1.default.deleteRuta);
exports.default = router;
