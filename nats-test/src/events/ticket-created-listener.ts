import {JsMsg} from "nats";
import { Listener } from "./base-listener";
import { TicketCreatedEvent } from "./ticket-created-event";
import {Subjects} from "./subjects";


export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    stream = 'TICKETS';
    readonly subject= Subjects.TicketCreated;
    durableName = 'payments-service';

    onMessage(data: TicketCreatedEvent['data'], msg: JsMsg) {   //типы у параметров функции нужны потому что они прямо не ставятся TS из абстракции, но сравниваются с нею, чтобы не подставить другой тип
        console.log('Event data!', data);

        // console.log(data.id);
        // console.log(data.title);

        msg.ack();
    }
}