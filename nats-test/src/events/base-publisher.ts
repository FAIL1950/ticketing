import { Subjects } from './subjects';
import {
    Codec,
    JetStreamClient,
    NatsConnection,
    RetentionPolicy,
    StorageType,
    StringCodec
} from "nats";

interface Event {
    subject: Subjects;
    data: any;
}

export abstract class Publisher<T extends Event> {
    abstract subject: T['subject'];
    abstract stream: string;
    private client: NatsConnection;
    private js: JetStreamClient;
    private sc: Codec<string>;

    constructor(client: NatsConnection)
    {
        this.client = client;
        this.js = client.jetstream();
        this.sc = StringCodec();
    }

    async publish(data: T['data']) {
        const jsm = await this.client.jetstreamManager();
        try {
            const streamInfo = await jsm.streams.info(this.stream);
            console.log(`Stream ${this.stream} already exists (${streamInfo.state.messages} messages)`);
        } catch (err: any) {

            if (err.api_error?.err_code === 10059) {
                await jsm.streams.add({
                    name: this.stream,
                    subjects: [`${this.stream.toLowerCase()}.*`],
                    retention: RetentionPolicy.Limits, // Хранить по лимитам
                    max_age: 60 * 60 * 24 * 1000000000, // 24 часа в наносекундах
                    max_msgs: 1000, // Максимум 1000 сообщений
                    storage: StorageType.File, // Хранить на диске
                });
                console.log(`Stream ${this.stream} created`);
            }
            else {
                throw err;
            }

        }

        await this.js.publish(this.subject, this.sc.encode(JSON.stringify(data)));
        console.log('Event published to subject', this.subject);
    }
}