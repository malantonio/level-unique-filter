var test = require('tape')
var stream = require('stream')
var UniqueFilter = require('./')

var returnVal = function () { return '=^_^=' }

var Level = require('level')
var db = Level('./db')
var uniq = UniqueFilter(db, {generateValue: returnVal})

var obj1 = { aye: "bee" }
var hashedObj1 = uniq._hashKey(obj1)
var expectedObj1Val = returnVal()

test('throws if unknown hash algorithm is passed', function (t) {
  t.plan(1)
  t.throws(function () {
    UniqueFilter(db, {algorithm: 'cats'})
  }, new RegExp('cats'))
})

test('first pass through returns object', function (t) {
  t.plan(3)

  uniq.isUnique(obj1, function (isUnique, passedObject, dbval) {
    t.ok(isUnique, '`isUnique` parameter is true')
    t.deepEqual(passedObject, obj1, 'object being checked is returned second')
    t.equal(dbval, expectedObj1Val, 'dbval contains value from uniq.generateValue')
  })
})

test('second pass through returns nothing', function (t) {
  t.plan(3)

  uniq.isUnique(obj1, function (isUnique, passedObject, dbval) {
    t.notOk(isUnique, '`isUnique` parameter is now false')
    t.deepEqual(passedObject, obj1, 'objected being checked is still returned')
    t.equal(dbval, expectedObj1Val, 'dbval is still passed')
  })

})

test('stream only passes through unique items', function (t) {
  var rs = new stream.Readable
  var obj2 = {bee: 'cee'}
  var count = 0

  rs.push(JSON.stringify(obj1))
  rs.push(JSON.stringify(obj2))
  rs.push(null)

  var testStream = rs.pipe(uniq.stream())
  testStream.on('data', function (d) {
    count++
    t.deepEqual(obj2, JSON.parse(d.toString()), 'obj2 is passed through')
  })

  testStream.on('end', function () {
    t.equal(1, count, 'only one item passed through')
    t.end()
  })
})

test.onFinish(function () {
  require('child_process').exec('rm -r ./db')
})
