"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const movimiento_caja_sucursal_1 = __importDefault(require("../controllers/movimiento_caja_sucursal"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post('/createmovimiento', movimiento_caja_sucursal_1.default.createMovimientoCajaSucursal);
router.get('/getmovimientos/:caja_sucursal_id', movimiento_caja_sucursal_1.default.getMovimientosByCajaSucursalId);
router.patch('/anularmovimiento/:movimiento_id', movimiento_caja_sucursal_1.default.anularMovimientoCajaSucursal);
exports.default = router;
