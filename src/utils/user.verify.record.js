const timeoutInSeconds = 120

module.exports = class {
    static _record = {}

    static add(id) {
        if (id in this._record)
            return false

        this._record[id] = setTimeout(() => delete this._record[id], timeoutInSeconds * 1000)
        return true
    }
}