import { scrypt, randomBytes } from "node:crypto";
import { promisify} from "node:util";

const scryptAsync = promisify<string, string, number, Buffer>(scrypt);

export class Password {
    static async toHash(password: string) {
        const salt = randomBytes(8).toString("hex");
        const buf = await scryptAsync(password, salt, 64);

        return `${buf.toString("hex")}.${salt}`;
    }

    static async compare(storedPassword:string, suppliedPassword: string) {
        const [hashedPassword, salt] = storedPassword.split(".");
        if (!salt) throw new Error("Invalid stored password format");
        const buf = await scryptAsync(suppliedPassword, salt, 64);

        return buf.toString("hex") === hashedPassword;
    }
}
