// @ts-nocheck
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import AccountType from '#models/account_type'
import Payee from '#models/payee'
import Stock from '#models/stock'
import Transaction from '#models/transaction'
import AccountTypeService from '#services/account_type_service'
import { columnCurrency } from '#start/orm/column'
import type { AccountGroupConfig } from '#config/account'

export default class Account extends BaseModel {
  // region Columns

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare accountTypeId: number

  @column()
  declare name: string

  @column()
  declare note: string

  @column.date()
  declare dateOpened: DateTime | null

  @column.date()
  declare dateClosed: DateTime | null

  @columnCurrency()
  declare balance: number

  @columnCurrency()
  declare startingBalance: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // endregion

  // region Unmapped Properties

  aggregations: Record<string, number> = {}

  // endregion

  // region Relationships

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => AccountType)
  declare accountType: BelongsTo<typeof AccountType>

  @hasOne(() => Payee)
  declare payee: HasOne<typeof Payee>

  @hasMany(() => Stock)
  declare stocks: HasMany<typeof Stock>

  @hasMany(() => Transaction)
  declare transactions: HasMany<typeof Transaction>

  // endregion

  // region Computed Properties

  @computed()
  get accountGroup(): AccountGroupConfig {
    return AccountTypeService.getAccountTypeGroup(this.accountTypeId)
  }

  @computed()
  get isCreditIncrease(): boolean {
    return AccountTypeService.isCreditIncreaseById(this.accountTypeId)
  }

  @computed()
  get isBudgetable() {
    return AccountTypeService.isBudgetable(this.accountTypeId)
  }

  @computed()
  get balanceDisplay() {
    return '$' + this.balance.toLocaleString('en-US')
  }

  // endregion
}
