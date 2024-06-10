// @ts-nocheck
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Payee from '#models/payee'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'
import Income from '#models/income'
import StockPurchase from '#models/stock_purchase'
import Stock from '#models/stock'
import Account from '#models/account'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Payee)
  declare payees: HasMany<typeof Payee>

  @hasMany(() => Transaction)
  declare transactions: HasMany<typeof Transaction>

  @hasMany(() => Income)
  declare incomes: HasMany<typeof Income>

  @hasMany(() => StockPurchase)
  declare stockPurchases: HasMany<typeof StockPurchase>

  @hasMany(() => Stock)
  declare stocks: HasMany<typeof Stock>

  @hasMany(() => Account)
  declare accounts: HasMany<typeof Account>
}
