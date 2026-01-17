import jwt from 'jsonwebtoken';

export const generarJWT = (uid: number, name: string) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, name };

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
