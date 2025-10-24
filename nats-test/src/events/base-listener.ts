import {
    StringCodec,
    AckPolicy,
    NatsConnection,
    JetStreamClient, Codec, JsMsg, nanos
} from 'nats';

import {Subjects} from "./subjects";

interface Event {
    subject: Subjects;
    data: any;
}

export abstract class Listener<T extends  Event>
{
    abstract subject: T['subject'];
    abstract durableName: string;
    abstract stream: string;
    abstract onMessage(data: T['data'], msg:JsMsg): void;
    protected ackWait = nanos(5 * 1000);
    protected ackPolicy = AckPolicy.Explicit;
    private client: NatsConnection;
    private js: JetStreamClient;
    private sc: Codec<string>;

    constructor(client: NatsConnection)
    {
        this.client = client;
        this.js = client.jetstream();
        this.sc = StringCodec();
    }

    async listen()
    {
        const jsm = await this.client.jetstreamManager();
        try {
            await jsm.consumers.info(this.stream, this.durableName);
            console.log(`Consumer "${this.durableName}" already exists, skipping...`);
        } catch (err: any) {

            if (err.api_error?.err_code === 10014) {
                console.log(`Consumer "${this.durableName}" not found, creating...`);
                await jsm.consumers.add(this.stream, {
                    durable_name: this.durableName,
                    filter_subject: this.subject,
                    ack_policy: this.ackPolicy,
                    ack_wait: this.ackWait
                });
            } else {
                throw err;
            }
        }

        const consumer = await this.js.consumers.get(this.stream, this.durableName);

        console.log('Waiting for events...');

        const messages = await consumer.consume();

        for await (const m of messages) {
            this.onMessage(this.parseMessage(m), m);
        }

    }

    parseMessage(msg: JsMsg) {
        return JSON.parse(this.sc.decode(msg.data));
    }
}