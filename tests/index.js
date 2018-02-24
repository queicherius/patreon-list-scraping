const patreonList = require('../src/index')

const cookie = ``

async function run () {
  const patreons = await patreonList({
    cookie: cookie,

    // False: Return an object with Month -> Patreons
    // True: Return one array of merged Patreons from all months
    unify: true
  })

  console.log(patreons)
}

run()
