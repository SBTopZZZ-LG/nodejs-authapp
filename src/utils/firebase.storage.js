var admin = require("firebase-admin")
var serviceAccount = require("../configs/nodejs-authapp-firebase-adminsdk-r63cp-b726a37999.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const storage = admin.storage().bucket("gs://nodejs-authapp.appspot.com")

module.exports = class {
    static async uploadFile(filePath, remotePath) {
        return storage.upload(filePath, { destination: remotePath })
    }
    static async getFiles(path) {
        return storage.getFiles(path)
    }
    static async getFile(path) {
        return storage.file(path)
    }
    static async generateUrl(path) {
        return (await storage.file(path).getSignedUrl({ action: "read", expires: Date.now() + 24 * 60 * 60 * 1000 }))[0]
    }
    static async deleteFile(path) {
        return storage.deleteFiles([path])
    }
}