const { assert } = require('chai')
const { sassert, TimeMachine, getConstants } = require('sol-army-knife')
const JRC223Mock = artifacts.require('JRC223Mock')
const DEFI = artifacts.require('DEFI')

const web3 = global.web3

contract('DEFI', (accounts) => {
  const { ACCT0, ACCT1, INVALID_ADDR, MAX_GAS } = getConstants(accounts)
  const timeMachine = new TimeMachine(web3)
  let jusd
  let defi
  let defiMethods

  beforeEach(async () => {
    await timeMachine.snapshot()

    jusd = new web3.eth.Contract(JRC223Mock.abi)
    jusd = await jusd.deploy({
      data: JRC223Mock.bytecode,
      arguments: [ACCT0],
    }).send({ from: ACCT0, gas: MAX_GAS })

    defi = new web3.eth.Contract(DEFI.abi)
    defi = await defi.deploy({
      data: DEFI.bytecode,
      arguments: [ACCT0, jusd._address],
    }).send({ from: ACCT0, gas: MAX_GAS })
    defiMethods = defi.methods
  })
  
  afterEach(async () => {
    await timeMachine.revert()
  })

  describe('constructor', async () => {
    it('should initialize all the values correctly', async () => {
      assert.equal(await defiMethods.owner().call(), ACCT0)
      assert.equal(await defiMethods.name().call(), 'DEFI Token')
      assert.equal(await defiMethods.symbol().call(), 'DEFI')
      assert.equal(await defiMethods.decimals().call(), 18)
      assert.equal(await defiMethods.totalSupply().call(), 0)
      assert.equal(await defiMethods.jusdToken().call(), jusd._address)
    })

    it('throws if owner is not valid', async () => {
      defi = new web3.eth.Contract(DEFI.abi)
      await sassert.revert(
        defi.deploy({
          data: DEFI.bytecode,
          arguments: [INVALID_ADDR, jusd._address],
        }).send({ from: ACCT0, gas: MAX_GAS }),
        'Requires valid address.')
    })

    it('throws if jusdToken is not valid', async () => {
      defi = new web3.eth.Contract(DEFI.abi)
      await sassert.revert(
        defi.deploy({
          data: DEFI.bytecode,
          arguments: [ACCT0, INVALID_ADDR],
        }).send({ from: ACCT0, gas: MAX_GAS }),
        'Requires valid address.')
    })
  })
})
