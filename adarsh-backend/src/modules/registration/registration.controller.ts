import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { createRegistration } from "./registration.service";

/**
 * ===============================
 * CREATE REGISTRATION
 * POST /api/registration
 * ===============================
 */
export async function createRegistrationHandler(req: Request, res: Response) {
  try {
    const result = await createRegistration({
      body: req.body,
      file: (req as any).file || null,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Registration saved successfully.",
      data: result,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({
      success: false,
      message: e?.message || "Registration failed",
    });
  }
}

/**
 * ===============================
 * GET ALL REGISTRATIONS (LIST)
 * GET /api/registration
 * ===============================
 */
export async function getAllRegistrationsHandler(
  req: Request,
  res: Response
) {
  try {
    const list = await prisma.registration.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: list,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
}

/**
 * ===============================
 * DELETE REGISTRATION
 * DELETE /api/registration/:id
 * ===============================
 */
export async function deleteRegistrationHandler(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    await prisma.registration.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Registration deleted successfully.",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Failed to delete registration",
    });
  }
}
