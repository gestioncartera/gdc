"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generarJWT = (usuario) => {
    return new Promise((resolve, reject) => {
        const payload = { usuario_id: usuario.usuario_id,
            tipo_usuario: usuario.tipo_usuario,
            sucursal_id: usuario.sucursal_id
        };
        jsonwebtoken_1.default.sign(payload, process.env.SK_JWT || '', {
            expiresIn: '4h'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            }
            else {
                resolve(token);
            }
        });
    });
};
exports.generarJWT = generarJWT;
