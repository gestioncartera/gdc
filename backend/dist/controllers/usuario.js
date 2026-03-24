"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.getCobradoresActivos = exports.deleteUsuario = exports.updatePassword = exports.updateUsuario = exports.getUsuarioByDNI = exports.getUsuarioById = exports.getUsuarios = exports.createUsuario = void 0;
const usuario_1 = __importDefault(require("../models/usuario"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const generar_jwt_1 = require("../helpers/generar-jwt");
//crear usuario
const createUsuario = async (req, res) => {
    try {
        if (!req.body.sucursal_id ||
            !req.body.nombres ||
            !req.body.apellidos ||
            !req.body.dni ||
            !req.body.tipo_usuario ||
            req.body.nombres.trim() === "" ||
            req.body.apellidos.trim() === "" ||
            req.body.dni.trim() === "" ||
            !req.body.email ||
            !req.body.password) {
            return res.status(400).send({ error: "Faltan datos obligatorios" });
        }
        const existeUsuario = await usuario_1.default.getUsuarioByDNI(req.body.dni);
        if (existeUsuario) {
            return res
                .status(409)
                .send({
                error: "Ya existe un usuario con ese Numero de identificacion  ",
            });
        }
        // Encriptar contraseña
        const salt = await bcrypt_1.default.genSalt(10);
        req.body.password = await bcrypt_1.default.hash(req.body.password, salt);
        const newUsuario = await usuario_1.default.createUsuario(req.body);
        return !newUsuario
            ? res.status(400).send({ error: "El usuario no pudo ser creado" })
            : res.status(201).send({ message: "Usuario creado exitosamente" });
    }
    catch (error) {
        res.status(500).send({ error: "Error al crear el usuario" });
    }
};
exports.createUsuario = createUsuario;
//obtener todos los usuarios
const getUsuarios = async (req, res) => {
    try {
        const idSucursal = parseInt(req.params.idSucursal);
        const usuarios = await usuario_1.default.getUsuarios(idSucursal);
        return usuarios.length === 0
            ? res.status(404).send({ message: "No se encontraron usuarios" })
            : res.status(200).json(usuarios);
    }
    catch (error) {
        res.status(500).send({ error: "Error al obtener los usuarios" });
    }
};
exports.getUsuarios = getUsuarios;
//buscar usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const usuarioEncontrado = await usuario_1.default.getUsuarioById(id);
        return usuarioEncontrado === null
            ? res.status(404).send({ message: "Usuario no encontrado" })
            : res.status(200).json(usuarioEncontrado);
    }
    catch (error) {
        res.status(500).send({ error: "Error al obtener el usuario" });
    }
};
exports.getUsuarioById = getUsuarioById;
//buscar usuario por DNI
const getUsuarioByDNI = async (req, res) => {
    try {
        const dni = req.params.dni;
        const usuarioEncontrado = await usuario_1.default.getUsuarioByDNI(dni);
        return usuarioEncontrado === null
            ? res.status(404).send({ message: "Usuario no encontrado" })
            : res.status(200).json(usuarioEncontrado);
    }
    catch (error) {
        res.status(500).send({ error: "Error al obtener el usuario" });
    }
};
exports.getUsuarioByDNI = getUsuarioByDNI;
//actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existeUsuario = await usuario_1.default.getUsuarioById(id);
        if (!existeUsuario) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        const usuarioActualizado = await usuario_1.default.updateUsuario(id, req.body);
        return res
            .status(200)
            .send({ message: "Usuario actualizado exitosamente" });
    }
    catch (error) {
        res.status(500).send({ error: "Error al actualizar el usuario" });
    }
};
exports.updateUsuario = updateUsuario;
//Actualizar contraseña de usuario
const updatePassword = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existeUsuario = await usuario_1.default.getUsuarioById(id);
        if (!existeUsuario) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        // Encriptar nueva contraseña
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(req.body.password, salt);
        const updatedUsuario = await usuario_1.default.updatePassword(id, hashedPassword);
        return res
            .status(200)
            .send({ message: "Contraseña actualizada exitosamente", updatedUsuario });
    }
    catch (error) {
        res.status(500).send({ error: "Error al actualizar la contraseña" });
    }
};
exports.updatePassword = updatePassword;
//eliminar usuario
const deleteUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existeUsuario = await usuario_1.default.getUsuarioById(id);
        if (!existeUsuario) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        await usuario_1.default.deleteUsuario(id);
        return res.status(200).send({ message: "Usuario eliminado exitosamente" });
    }
    catch (error) {
        res.status(500).send({ error: "Error al eliminar el usuario" });
    }
};
exports.deleteUsuario = deleteUsuario;
//obtener cobradores activos y con ruta asignada
const getCobradoresActivos = async (req, res) => {
    try {
        const idSucursal = parseInt(req.params.idSucursal);
        const cobradores = await usuario_1.default.getCobradoresActivos(idSucursal);
        return cobradores.length === 0
            ? res.status(404).send({ message: "No se encontraron cobradores activos con ruta asignada" })
            : res.status(200).json(cobradores);
    }
    catch (error) {
        res.status(500).send({ error: "Error al obtener los cobradores activos con ruta asignada" });
    }
};
exports.getCobradoresActivos = getCobradoresActivos;
//Login usuario
const login = async (req, res) => {
    try {
        //validar datos
        if (!req.body.email ||
            !req.body.password ||
            req.body.email.trim() === "" ||
            req.body.password.trim() === "") {
            return res.status(400).send({ error: "Faltan datos obligatorios" });
        }
        const usuarioEncontrado = await usuario_1.default.getUsuarioByEmail(req.body.email);
        if (!usuarioEncontrado) {
            return res.status(401).send({ error: "Credenciales inválidas" });
        }
        const validPassword = await bcrypt_1.default.compare(req.body.password, usuarioEncontrado.password);
        if (!validPassword) {
            return res.status(401).send({ error: "Credenciales inválidas" });
        }
        // Generar JWT
        //se agrega el signo de exclamacion para indicar que el valor no es nulo ni indefinido
        const token = await (0, generar_jwt_1.generarJWT)(usuarioEncontrado);
        return res.status(200).json({
            token,
            usuario: {
                usuario_id: usuarioEncontrado.usuario_id,
                tipo_usuario: usuarioEncontrado.tipo_usuario,
                sucursal_id: usuarioEncontrado.sucursal_id,
                nombre: usuarioEncontrado.nombres,
                apellidos: usuarioEncontrado.apellidos
            }
        });
    }
    catch (error) {
        res.status(500).send({ error: "Error al iniciar sesión" });
    }
};
exports.login = login;
exports.default = {
    createUsuario: exports.createUsuario,
    getUsuarios: exports.getUsuarios,
    getUsuarioById: exports.getUsuarioById,
    getUsuarioByDNI: exports.getUsuarioByDNI,
    updateUsuario: exports.updateUsuario,
    deleteUsuario: exports.deleteUsuario,
    getCobradoresActivos: exports.getCobradoresActivos,
    login: exports.login,
    updatePassword: exports.updatePassword,
};
