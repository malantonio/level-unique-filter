var crypto = require('crypto')
var through = require('through2')

module.exports = LevelUniqueFilter

function LevelUniqueFilter (db, opts) {
  if (!(this instanceof LevelUniqueFilter)) return new LevelUniqueFilter(db, opts)

  opts = opts || {}
  this._db = db

  this.generateValue = opts.generateValue || Date.now
  this.algorithm = opts.algorithm || 'sha256'

  if (crypto.getHashes().indexOf(this.algorithm) === -1)
    throw Error('Provided hash algorithm ' + this.algorithm + ' not offered')
}

LevelUniqueFilter.prototype.stream = function uniqueFilterStream () {
  var self = this

  return through.obj(function (thing, enc, next) {
    var stream = this
    var buffMode = false

    if (typeof thing !== 'string') {
      if (Buffer.isBuffer(thing)) {
        buffMode = true
        thing = thing.toString()
      } else {
        thing = JSON.stringify(thing)
      }
    }

    return self.isUnique(thing, function (unique, _, dbvalue) {
      if (buffMode)
        thing = Buffer(thing)
      if (unique)
        stream.write(thing + '\n')
      next()
    })
  })
}

LevelUniqueFilter.prototype.isUnique = function (thing, callback) {
  var self = this
  var hashKey = self._hashKey(thing)

  self._db.get(hashKey, function (err, entry) {
    // no error === thing exists/isn't unique
    if (!err) return callback(false, thing, entry)
    var val = self.generateValue()

    self._db.put(hashKey, val, function (err) {
      if (err) return callback(false, thing, null)
      return callback(true, thing, val)
    })
  })
}

LevelUniqueFilter.prototype._hashKey = function hashKey (thing) {
  if (typeof thing !== 'string') thing = JSON.stringify(thing)
  return crypto.createHash(this.algorithm).update(thing).digest('base64')
}
