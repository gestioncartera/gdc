import usuario from "../models/usuario";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generarJWT } from "../helpers/generar-jwt";

//crear usuario
export const createUsuario = async (req: Request, res: Response) => {
  try {
    if (
      !req.body.sucursal_id ||
      !req.body.nombres ||
      !req.body.apellidos ||
      !req.body.dni ||
      !req.body.tipo_usuario ||
      req.body.nombres.trim() === "" ||
      req.body.apellidos.trim() === "" ||
      req.body.dni.trim() === "" ||
      !req.body.email ||
      !req.body.password
    ) {
      return res.status(400).send({ error: "Faltan datos obligatorios" });
    }
    const existeUsuario = await usuario.getUsuarioByDNI(req.body.dni);
    if (existeUsuario) {
      return res
        .status(409)
        .send({
          error: "Ya existe un usuario con ese Numero de identificacion  ",
        });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const newUsuario = await usuario.createUsuario(req.body);
    return !newUsuario
      ? res.status(400).send({ error: "El usuario no pudo ser creado" })
      : res.status(201).send({ message: "Usuario creado exitosamente" });
  } catch (error) {
    res.status(500).send({ error: "Error al crear el usuario" });
  }
};

//obtener todos los usuarios
export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const idSucursal = parseInt(req.params.idSucursal);
    const usuarios = await usuario.getUsuarios(idSucursal);
    return usuarios.length === 0
      ? res.status(404).send({ message: "No se encontraron usuarios" })
      : res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).send({ error: "Error al obtener los usuarios" });
  }
};

//buscar usuario por ID
export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioEncontrado = await usuario.getUsuarioById(id);

    return usuarioEncontrado === null
      ? res.status(404).send({ message: "Usuario no encontrado" })
      : res.status(200).json(usuarioEncontrado);
  } catch (error) {
    res.status(500).send({ error: "Error al obtener el usuario" });
  }
};

//buscar usuario por DNI
export const getUsuarioByDNI = async (req: Request, res: Response) => {
  try {
    const dni = req.params.dni;
    const usuarioEncontrado = await usuario.getUsuarioByDNI(dni);

    return usuarioEncontrado === null
      ? res.status(404).send({ message: "Usuario no encontrado" })
      : res.status(200).json(usuarioEncontrado);
  } catch (error) {
    res.status(500).send({ error: "Error al obtener el usuario" });
  }
};

//actualizar usuario
export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existeUsuario = await usuario.getUsuarioById(id);
    if (!existeUsuario) {
      return res.status(404).send({ message: "Usuario no encontrado" });
    }
    const usuarioActualizado = await usuario.updateUsuario(id, req.body);
    return res
      .status(200)
      .send({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    res.status(500).send({ error: "Error al actualizar el usuario" });
  }
};

//Actualizar contraseña de usuario
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existeUsuario = await usuario.getUsuarioById(id);
    if (!existeUsuario) {
      return res.status(404).send({ message: "Usuario no encontrado" });
    }
    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const updatedUsuario = await usuario.updatePassword(id, hashedPassword);
    return res
      .status(200)
      .send({ message: "Contraseña actualizada exitosamente", updatedUsuario });
  } catch (error) {
    res.status(500).send({ error: "Error al actualizar la contraseña" });
  }
};

//eliminar usuario
export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existeUsuario = await usuario.getUsuarioById(id);
    if (!existeUsuario) {
      return res.status(404).send({ message: "Usuario no encontrado" });
    }
    await usuario.deleteUsuario(id);
    return res.status(200).send({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res.status(500).send({ error: "Error al eliminar el usuario" });
  }
};

//Login usuario
export const login = async (req: Request, res: Response) => {
  try {
    //validar datos
    if (
      !req.body.email ||
      !req.body.password ||
      req.body.email.trim() === "" ||
      req.body.password.trim() === ""
    ) {
      return res.status(400).send({ error: "Faltan datos obligatorios" });
    }

    const usuarioEncontrado = await usuario.getUsuarioByEmail(req.body.email);
    if (!usuarioEncontrado) {
      return res.status(401).send({ error: "Credenciales inválidas" });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      usuarioEncontrado.password,
    );

    if (!validPassword) {
      return res.status(401).send({ error: "Credenciales inválidas" });
    }


    // Generar JWT
    //se agrega el signo de exclamacion para indicar que el valor no es nulo ni indefinido
    const token = await generarJWT(
      usuarioEncontrado
    );

    return res.status(200).json({
      token,
      usuario: {
        usuario_id: usuarioEncontrado.usuario_id,
        tipo_usuario: usuarioEncontrado.tipo_usuario,
        sucursal_id: usuarioEncontrado.sucursal_id,
        nombres:usuarioEncontrado.nombres }
    });
  } catch (error) {
    res.status(500).send({ error: "Error al iniciar sesión" });
  }
};

export default {
  createUsuario,
  getUsuarios,
  getUsuarioById,
  getUsuarioByDNI,
  updateUsuario,
  deleteUsuario,
  login,
  updatePassword,
};
