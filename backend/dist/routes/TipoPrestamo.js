"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TipoPrestamo_1 = __importDefault(require("../controllers/TipoPrestamo"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Ruta para crear un nuevo tipo de préstamo
router.post("/createTipoPrestamo", auth_1.default, TipoPrestamo_1.default.createTipoPrestamo);
router.get("/getTipoPrestamo/:sucursal_id", auth_1.default, TipoPrestamo_1.default.getTiposPrestamo);
router.get("/getTipoPrestamoById/:id", auth_1.default, TipoPrestamo_1.default.getTipoPrestamoById);
router.put("/updateTipoPrestamo/:id", auth_1.default, TipoPrestamo_1.default.updateTipoPrestamo);
router.delete("/deleteTipoPrestamo/:id", auth_1.default, TipoPrestamo_1.default.deleteTipoPrestamo);
exports.default = router;
