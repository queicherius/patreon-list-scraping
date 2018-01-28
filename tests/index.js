const patreonList = require('../src/index')

const cookie = `...`

async function run () {
  const patreons = await patreonList({
    cookie: cookie,
    unify: true
  })

  console.log(patreons)
}

run()
