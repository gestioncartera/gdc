import jwt from 'jsonwebtoken';
import {Usuario} from '../models/usuario';

export const generarJWT = (usuario: Usuario) => {
    return new Promise((resolve, reject) => {
        const payload = {usuario_id: usuario.usuario_id,
            tipo_usuario: usuario.tipo_usuario,
            sucursal_id: usuario.sucursal_id

        };

        jwt.sign(payload, process.env.SK_JWT || '', {
            expiresIn: '4h'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        });
    });
};
