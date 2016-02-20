var ref = require('ssb-ref')
var Repo = require('./lib/repo')
var pull = require('pull-stream')

exports.Repo = Repo

exports.createRepo = function (sbot, options, cb) {
  if (typeof options == 'function') cb = options, options = null
  var msg = {
    type: 'git-repo'
  }
  if (options) {
    if (options.forks && !ref.isMsg(options.forks))
      throw new Error('Invalid repo ID: ' + options.forks)
    for (var key in options)
      msg[key] = options[key]
  }
  sbot.publish(msg, function (err, msg) {
    var repo = new Repo(sbot, msg.key, msg.value)
    repo.synced = true
    cb(err, msg && repo)
  })
}

exports.getRepo = function (sbot, id, cb) {
  sbot.get(id, function (err, msg) {
    if (err) return cb(err)
    var repo = new Repo(sbot, id, msg)
    repo._sync()
    cb(null, repo)
  })
}

exports.repos = function (sbot, options) {
  return pull(
    sbot.createFeedStream(options),
    pull.filter(function (msg) {
      return msg.value.content.type === 'git-repo'
    }),
    pull.map(function (msg) {
      return new Repo(sbot, msg.key, msg.value.content)
    })
  )
}
