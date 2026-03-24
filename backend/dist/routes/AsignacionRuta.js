"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AsignacionRuta_1 = __importDefault(require("../controllers/AsignacionRuta"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.post('/createAsignacionRuta', auth_1.default, AsignacionRuta_1.default.createAsignacionRuta);
router.get('/getAsignacionesRuta', auth_1.default, AsignacionRuta_1.default.getAsignacionesRuta);
router.put('/updateAsignacionRuta/:id', auth_1.default, AsignacionRuta_1.default.updateAsignacionRuta);
router.delete('/deleteAsignacionRuta/:id', auth_1.default, AsignacionRuta_1.default.deleteAsignacionRuta);
exports.default = router;
