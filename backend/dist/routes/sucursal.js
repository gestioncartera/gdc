"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sucursal_1 = __importDefault(require("../controllers/sucursal"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.get('/getSucursales', auth_1.default, sucursal_1.default.getSucursales);
router.get('/getSucursalById/:id', auth_1.default, sucursal_1.default.getSucursalById);
router.post('/createSucursal', auth_1.default, sucursal_1.default.createSucursal);
router.put('/updateSucursal/:id', auth_1.default, sucursal_1.default.updateSucursal);
router.delete('/deleteSucursal/:id', auth_1.default, sucursal_1.default.deleteSucursal);
exports.default = router;
