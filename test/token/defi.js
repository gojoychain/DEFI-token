const { assert } = require('chai')
const { sassert, TimeMachine, getConstants, SolUtils } = require('sol-army-knife')
const JRC223Mock = artifacts.require('JRC223Mock')
const DEFI = artifacts.require('DEFI')

const web3 = global.web3
const { toBN } = web3.utils
const { toDenomination } = SolUtils

contract('DEFI', (accounts) => {
  const { ACCT0, ACCT1, INVALID_ADDR, MAX_GAS } = getConstants(accounts)
  const EXCHANGE_FUNC_SIG = '0x045d0389'
  const timeMachine = new TimeMachine(web3)
  const fundAmt = '1000000000000000000000'
  let jusd
  let jusdMethods
  let defi
  let defiMethods

  beforeEach(async () => {
    await timeMachine.snapshot()

    // Deploy JUSD
    jusd = new web3.eth.Contract(JRC223Mock.abi)
    jusd = await jusd.deploy({
      data: JRC223Mock.bytecode,
      arguments: [ACCT0],
    }).send({ from: ACCT0, gas: MAX_GAS })
    jusdMethods = jusd.methods

    // Send JUSD to other accts
    await jusd.methods.transfer(ACCT1, fundAmt).send({ from: ACCT0 })
    sassert.bnEqual(await jusdMethods.balanceOf(ACCT1).call(), fundAmt)

    // Deploy DEFI
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

  describe('constructor', () => {
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

  describe('exchange', () => {
    const ownerPercentage = 5

    it('should mint new DEFI and transfer some JUSD to the owner', async () => {
      sassert.bnEqual(await defiMethods.balanceOf(ACCT1).call(), 0)
      sassert.bnEqual(await jusdMethods.balanceOf(ACCT1).call(), fundAmt)
      const oldOwnerAmt = await jusdMethods.balanceOf(ACCT0).call()

      // Check acct balance changes
      const amt = toDenomination(1, 18).toString(10)
      const txReceipt = await jusdMethods['transfer(address,uint256,bytes)'](
        defi._address,
        amt,
        web3.utils.hexToBytes(EXCHANGE_FUNC_SIG),
      ).send({ from: ACCT1, gas: 200000 })
      sassert.bnEqual(await defiMethods.balanceOf(ACCT1).call(), amt)
      sassert.bnEqual(await defiMethods.totalSupply().call(), amt)
      sassert.bnEqual(
        await jusdMethods.balanceOf(ACCT1).call(),
        toBN(fundAmt).sub(toBN(amt))
      )

      // Check 5% JUSD went to owner
      const ownerAmt = toBN(amt).mul(toBN(ownerPercentage)).div(toBN(100))
      sassert.bnEqual(
        await jusdMethods.balanceOf(ACCT0).call(),
        toBN(oldOwnerAmt).add(ownerAmt),
      )

      // Check 6 Transfer events
      // 2 from call to JUSD.transfer223
      // 2 from DEFI.transfer (minting new tokens)
      // 2 from DEFI to JUSD transfer owner percentage
      sassert.event(txReceipt, 'Transfer', 6)
    })

    it('throws if amount is 0', async () => {
      await sassert.revert(
        jusdMethods['transfer(address,uint256,bytes)'](
          defi._address,
          '0',
          web3.utils.hexToBytes(EXCHANGE_FUNC_SIG),
        ).send({ from: ACCT1, gas: 200000 }),
        'Amount should be greater than 0',
      )
    })
  })
})
