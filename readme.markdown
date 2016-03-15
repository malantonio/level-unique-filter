# level-unique-filter

Uses LevelDB (or LevelDown-compatible store) to check historical uniqueness of
item. Useful for parsing a log with repeating values to only pass the new ones
through.

# usage

```
npm install level-unique-filter
```

## var uniq = UniqueFilter(LevelDB_compatible_store[, opts])

Pass a LevelDB-compatible store and an `opts` object (optional) to the
UniqueFilter constructor. `opts` has the following keys:

----------------|---------------
`algorithm`     | (string) the hashing algorithm used to generate the db key (default: `sha256`)
`generateValue` | (function) generates the value in the db (default returns `Date.now()`)

## uniq.isUnique(item, callback)

`callback`'s signature is `function (isUnique, passedItem, dbValue)`. `isUnique`
is a boolean describing the item's uniqueness in the database. `passedItem`
is the item itself, which is passed regardless of if it is unique or not. And
`dbValue` is the item's value in the database.

```javascript
var Level = require('level')
var db = Level('./db')
var UniqueFilter = require('level-unique-filter')
var uniq = UniqueFilter(uniq)

var item = process.argv[2]

uniq(item, function (isUnique, passedItem, dbValue) {
  if (!isUnique) {
    console.log(passedItem + ' was passed at ' + new Date(Date.parse(dbValue)))
  }
})
```

## unique.stream

returns a `through2` object stream that pushes unique objects through.

```javascript
var fs = require('fs')
var ndjson = require('ndjson')
var fileStream = fs.createReadStream('./logList.ndjson')
var outFile = fs.createWriteStream('./new-items.ndjson')

fileStream
  .pipe(ndjson())      // breaks file into nd-json objects
  .pipe(uniq.stream()) // filters unique items
  .pipe(outFile)       // writes them to file
```

# license

MIT
