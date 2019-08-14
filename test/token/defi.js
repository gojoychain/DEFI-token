const { assert } = require('chai')
const { sassert, TimeMachine, getConstants } = require('sol-army-knife')
const JRC223 = artifacts.require('JRC223')
const DEFI = artifacts.require('DEFI')

const web3 = global.web3

contract('DEFI', (accounts) => {
  const { ACCT0, ACCT1, INVALID_ADDR, MAX_GAS } = getConstants(accounts)
  const timeMachine = new TimeMachine(web3)
  let token

  beforeEach(async () => {
    await timeMachine.snapshot()

    token = new web3.eth.Contract(DEFI.abi)
    token = await token.deploy({
      data: DEFI.bytecode,
      arguments: [ACCT0, '0x28d7fEecd1aB9Dae7d83cbB986f2A2Ecb127183d'],
    }).send({ from: ACCT0, gas: MAX_GAS })
  })
  
  afterEach(async () => {
    await timeMachine.revert()
  })

  describe.only('constructor', async () => {
    it.only('should initialize all the values correctly', async () => {
      // assert.equal(await token.methods.owner().call(), TOKEN_PARAMS.owner)
      // assert.equal(await token.methods.name().call(), TOKEN_PARAMS.name)
      // assert.equal(await token.methods.symbol().call(), TOKEN_PARAMS.symbol)
      // assert.equal(await token.methods.decimals().call(), TOKEN_PARAMS.decimals)
      // assert.equal(await token.methods.totalSupply().call(), TOKEN_PARAMS.totalSupply)
      // assert.equal(await token.methods.balanceOf(TOKEN_PARAMS.owner).call(), TOKEN_PARAMS.totalSupply)
    })

    it('should emit both Transfer events', async () => {
      sassert.event(token, 'Transfer(address,address,uint256)')
      sassert.event(token, 'Transfer(address,address,uint256,bytes)')
    })

    it('throws if owner is not valid', async () => {
      try {
        await token.deploy({
          data: JUSD.bytecode,
          arguments: [
            TOKEN_PARAMS.name,
            TOKEN_PARAMS.symbol, 
            TOKEN_PARAMS.decimals,
            TOKEN_PARAMS.totalSupply,
            INVALID_ADDR,
          ],
        }).send({ from: OWNER, gas: 4712388 })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if name is empty', async () => {
      try {
        await token.deploy({
          data: JUSD.bytecode,
          arguments: [
            '',
            TOKEN_PARAMS.symbol, 
            TOKEN_PARAMS.decimals,
            TOKEN_PARAMS.totalSupply,
            TOKEN_PARAMS.owner,
          ],
        }).send({ from: OWNER, gas: 4712388 })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if symbol is empty', async () => {
      try {
        await token.deploy({
          data: JUSD.bytecode,
          arguments: [
            TOKEN_PARAMS.name, 
            '',
            TOKEN_PARAMS.decimals,
            TOKEN_PARAMS.totalSupply,
            TOKEN_PARAMS.owner,
          ],
        }).send({ from: OWNER, gas: 4712388 })
      } catch (e) {
        sassert.revert(e)
      }
    })
  })

  describe('mint', () => {
    it('mints new tokens and increases supply', async () => {
      await token.methods.mint(TOKEN_PARAMS.owner, 1).send({ from: OWNER })
      assert.equal(
        await token.methods.totalSupply().call(),
        TOKEN_PARAMS.totalSupply + 1
      )
      assert.equal(
        await token.methods.balanceOf(TOKEN_PARAMS.owner).call(),
        TOKEN_PARAMS.totalSupply + 1
      )

      await token.methods.mint(ACCT1, 1).send({ from: OWNER })
      assert.equal(
        await token.methods.totalSupply().call(),
        TOKEN_PARAMS.totalSupply + 2
      )
      assert.equal(await token.methods.balanceOf(ACCT1).call(), 1)
    })

    it('emits both Transfer events', async () => {
      const receipt = await token.methods.mint(
        TOKEN_PARAMS.owner,
        1,
      ).send({ from: OWNER })
      sassert.event(receipt, 'Transfer', 2)
    })

    it('throws if the account address is not valid', async () => {
      try {
        await token.methods.mint(INVALID_ADDR, 1).send({ from: OWNER })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if trying to mint from a non-owner address', async () => {
      assert.notEqual(await token.methods.owner().call(), ACCT1)
      try {
        await token.methods.mint(TOKEN_PARAMS.owner, 1).send({ from: ACCT1 })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if trying to mint 0', async () => {
      try {
        await token.methods.mint(TOKEN_PARAMS.owner, 0).send({ from: OWNER })
      } catch (e) {
        sassert.revert(e)
      }
    })
  })

  describe('burn', () => {
    it('burns existing tokens and decreases supply', async () => {
      await token.methods.burn(TOKEN_PARAMS.owner, 1).send({ from: OWNER })
      assert.equal(
        await token.methods.totalSupply().call(),
        TOKEN_PARAMS.totalSupply - 1
      )
      assert.equal(
        await token.methods.balanceOf(TOKEN_PARAMS.owner).call(),
        TOKEN_PARAMS.totalSupply - 1
      )
    })

    it('emits both Transfer events', async () => {
      const receipt = await token.methods.burn(
        TOKEN_PARAMS.owner,
        1,
      ).send({ from: OWNER })
      sassert.event(receipt, 'Transfer', 2)
    })

    it('throws if the account address is not valid', async () => {
      try {
        await token.methods.burn(INVALID_ADDR, 1).send({ from: OWNER })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if trying to burn from a non-owner address', async () => {
      assert.notEqual(await token.methods.owner().call(), ACCT1)
      try {
        await token.methods.burn(TOKEN_PARAMS.owner, 1).send({ from: ACCT1 })
      } catch (e) {
        sassert.revert(e)
      }
    })

    it('throws if trying to burn 0', async () => {
      try {
        await token.methods.burn(TOKEN_PARAMS.owner, 0).send({ from: OWNER })
      } catch (e) {
        sassert.revert(e)
      }
    })
  })
})
