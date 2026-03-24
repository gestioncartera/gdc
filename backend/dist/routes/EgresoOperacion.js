"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EgresoOperacion_1 = __importDefault(require("../controllers/EgresoOperacion"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.post("/createEgresoOperacion", auth_1.default, EgresoOperacion_1.default.createEgresoOperacion);
router.get("/getAllEgresosOperacionPendientes/:usuario_id", auth_1.default, EgresoOperacion_1.default.getAllEgresosOperacionPendientes);
router.delete("/egresooperacion/:id", auth_1.default, EgresoOperacion_1.default.deleteEgresoOperacion);
router.put("/egresooperacion/:id", auth_1.default, EgresoOperacion_1.default.updateEgresoOperacion);
router.post("/confirmarEgresosOperacion/:usuario_id", auth_1.default, EgresoOperacion_1.default.confirmarEgresosOperacion);
exports.default = router;
