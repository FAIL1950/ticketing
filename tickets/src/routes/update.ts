import express from "express";
import type {Request, Response} from "express";
import {body, param} from "express-validator";
import {
    validationRequest,
    NotFoundError,
    requireAuth,
    NotAuthorizedError, BadRequestError
} from "@agotickets/common";

import {Ticket} from "../models/ticket";
import {TicketUpdatedPublisher} from "../events/publishers/ticket-updated-publisher";
import {natsWrapper} from "../nats-wrapper";


const router = express.Router();

router.put(
    "/api/tickets/:id",
    [
        requireAuth,
        body('title').notEmpty().withMessage('Title is required'),
        body('price').isFloat({ gt: 0 }).withMessage('Price must be provided and must be grater than 0'),
        param('id')
            .isMongoId()
            .withMessage("Id must be a valid MongoDB ObjectId"),
        validationRequest,
    ],
    async (req: Request, res: Response) =>
    {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            throw new NotFoundError();
        }

        if (ticket.orderId) {
            throw new BadRequestError('Cannot edit a reserved ticket');
        }

        if (ticket.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError()
        }

        ticket.set({
            title: req.body.title,
            price: req.body.price
        });
        ticket.markModified('title', 'price')

        await ticket.save();
        await new TicketUpdatedPublisher(natsWrapper.client).publish({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            userId: ticket.userId,
            version: ticket.version
        });

        res.send(ticket);
    }
);

export {router as updateTicketRouter}
