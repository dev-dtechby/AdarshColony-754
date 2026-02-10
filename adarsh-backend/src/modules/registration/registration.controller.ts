import { Request, Response } from "express";
import { createRegistration } from "./registration.service";

export async function createRegistrationHandler(req: Request, res: Response) {
  try {
    const result = await createRegistration({
      body: req.body,
      file: (req as any).file || null,
      // userId/ip optional: aap audit add karna chahe to
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Registration saved successfully.",
      data: result,
    });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Registration failed",
    });
  }
}
