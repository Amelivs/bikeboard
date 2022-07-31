const { webcrypto } = require('crypto');
const { subtle } = webcrypto;
const fs = require('fs');

const projectHome = `${__dirname}/..`;

async function generateKey() {
    if (!fs.existsSync(`${projectHome}/private/key.txt`)) {
        let key = await subtle.generateKey({ name: 'AES-CTR', length: 128 }, true, ['encrypt', 'decrypt'])
        let exported = await subtle.exportKey('raw', key)
        let file = Buffer.from(exported).toString('base64')
        fs.writeFileSync(`${projectHome}/private/key.txt`, file, { encoding: 'utf-8' })
        console.log(file)
        return key;
    }
    let file = fs.readFileSync(`${projectHome}/private/key.txt`, { encoding: 'utf-8' })
    let rawKey = Buffer.from(file, 'base64');
    let key = await subtle.importKey('raw', rawKey, 'AES-CTR', true, ['encrypt', 'decrypt'])
    console.log(file)
    return key;
}

async function encryptData(key) {
    let encoder = new TextEncoder();
    let file = fs.readFileSync(`${projectHome}/private/seeding.json`, { encoding: 'utf-8' })
    let encryptedData = await subtle.encrypt({ name: 'AES-CTR', counter: new ArrayBuffer(16), length: 128 }, key, encoder.encode(file))
    fs.writeFileSync(`${projectHome}/src/assets/advanced.bin`, new Uint8Array(encryptedData), 'binary')
}

(async function main() {
    let key = await generateKey();
    await encryptData(key);
})()
