import express from "express";
import type { Request, Response } from "express";
import {NotFoundError, validationRequest} from "@agotickets/common";
import {param} from "express-validator";

import {Ticket} from "../models/ticket";


const router = express.Router();

router.get("/api/tickets/:id",
    param('id')
        .isMongoId()
        .withMessage("Id must be a valid MongoDB ObjectId"),
    validationRequest,
    async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        throw new NotFoundError();
    }

    res.send(ticket);
});

export { router as showTicketRouter };