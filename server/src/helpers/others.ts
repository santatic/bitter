import * as uuid from "uuid/v4";

export function randomString(count: number) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let text = "";
    for (let i = 0; i < count; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function randomNumber(length: number) {
    return Math.ceil(Math.random() * Math.pow(10, length));
}

export function getUuid(): string {
    return uuid();
}