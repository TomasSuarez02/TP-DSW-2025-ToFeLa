
import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/mysql";
import jwt from "jsonwebtoken";
import { Cliente } from "../cliente/cliente.entity.js";
import { AgenteInmobiliario } from "../agenteinmobiliario/agenteinmobiliario.entity.js";
import { orm } from "../shared/db/orm.js"; 

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body; // password es nro_doc en este caso
  const em = orm.em as EntityManager;

  try {

    let role: "cliente" | "agente" | null = null;
    let user:
      | (Cliente & { password: string; email: string; id: number })
      | (AgenteInmobiliario & { password: string; email: string; id: number })
      | null = null;

    const cliente = await em.findOne(Cliente, { email });
    if (cliente) {
      role = "cliente";
      user = cliente as any;
    } else {
      const agente = await em.findOne(AgenteInmobiliario, { email });
      if (agente) {
        role = "agente";
        user = agente as any;
      }
    }

    if (!user || !role) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }


    if (String(user.password) !== String(password)) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.json({ accessToken, role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
