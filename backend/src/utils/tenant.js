// Each gym account has its own MongoDB database. The account of the current request (or background job)
// is kept in an AsyncLocalStorage, and every gym model resolves to that account's database when it is used.
// Code outside an account context cannot touch gym data at all: it throws instead of guessing.
import { AsyncLocalStorage } from 'node:async_hooks'
import mongoose from 'mongoose'

const storage = new AsyncLocalStorage()
const schemas = new Map() // model name -> schema, for every gym model
const prepared = new Map() // database name -> promise of its indexes being built
let scriptAccount = null // set only by tests and command-line scripts, never by the server

const connectionOf = (account) => mongoose.connection.useDb(account.dbName, { useCache: true })

// Builds the indexes of every gym model in this account's database, once. The unique ones matter:
// they stop a reminder from being queued twice. Call before the account's first use.
export function prepareAccount(account) {
  if (!prepared.has(account.dbName)) {
    const conn = connectionOf(account)
    const work = Promise.all([...schemas].map(([name, schema]) => conn.model(name, schema).init()))
    prepared.set(
      account.dbName,
      work.catch((err) => {
        prepared.delete(account.dbName) // try again next time
        throw err
      }),
    )
  }
  return prepared.get(account.dbName)
}

// Runs fn with `account` ({ id, dbName, … }) as the current gym; everything fn awaits stays in that gym.
export async function runAs(account, fn) {
  await prepareAccount(account)
  return storage.run(account, fn)
}

// Same, for code that already prepared the account and must call `fn` synchronously (Express `next`).
export const runPrepared = (account, fn) => storage.run(account, fn)

export function currentAccount() {
  const account = storage.getStore() || scriptAccount
  if (!account?.dbName) throw new Error('No gym account in context')
  return account
}

// Tests and command-line scripts work on one gym for the whole process.
export async function useAccountForScript(account) {
  await prepareAccount(account)
  scriptAccount = account
}

// A model that lives in every gym's own database. Used exactly like a normal mongoose model.
export function tenantModel(name, schema) {
  schemas.set(name, schema)
  const real = () => connectionOf(currentAccount()).model(name, schema)
  return new Proxy(function () {}, {
    get(target, prop) {
      const model = real()
      const value = Reflect.get(model, prop, model)
      return typeof value === 'function' && prop !== 'prototype' ? value.bind(model) : value
    },
    construct: (target, args) => new (real())(...args),
    apply: (target, self, args) => real()(...args),
    has: (target, prop) => prop in real(),
  })
}
