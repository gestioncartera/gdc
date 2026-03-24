"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = async (req, res, next) => {
    let token = req.header("Authorization");
    if (!token) {
        return res.status(400).send({ message: "Authorization denied: No token" });
    }
    // El token suele venir como "Bearer <token>"
    token = token.split(" ")[1];
    if (!token) {
        return res.status(400).send({ message: "Authorization denied: No token" });
    }
    try {
        // Verificar el token usando la clave secreta de entorno
        req.user = jsonwebtoken_1.default.verify(token, process.env.SK_JWT || '');
        next();
    }
    catch (e) {
        return res.status(400).send({ message: "Authorization denied: Invalid token" });
    }
};
exports.default = auth;
