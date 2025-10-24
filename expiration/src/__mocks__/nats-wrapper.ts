export const natsWrapper = {
    client: {
        jetstream: jest.fn().mockReturnValue({
            publish: jest.fn().mockResolvedValue(null),
        }),
        jetstreamManager: jest.fn().mockResolvedValue({
            streams: {
                info: jest.fn().mockResolvedValue(null),
            },
        }),
    },
};