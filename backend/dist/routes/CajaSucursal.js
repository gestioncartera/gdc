"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CajaSucursal_1 = __importDefault(require("../controllers/CajaSucursal"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/createCajaSucursal", CajaSucursal_1.default.createCajaSucursal);
router.get("/getCajaSucursal/:sucursal_id", CajaSucursal_1.default.getAllCajasSucursal);
exports.default = router;
