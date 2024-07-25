# @adocasts.com/dto

> Easily make and generate DTOs from Lucid Models

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

Converting Lucid Models to DTO files can be a tedious task.
This package aims to make it a little less so
by reading your model's property definitions and porting them to a DTO.
Will it be perfect? Likely not, but it should help cut back on the
repetition needed to complete the task.

## Installation

You can easily install and configure via the Ace CLI's `add` command.

```shell
node ace add @adocasts.com/dto
```

##### Manual Install & Configure

You can also manually install and configure if you'd prefer

```shell
npm install @adocasts.com/dto
```

```shell
node ace configure @adocasts.com/dto
```

##### Define DTO Import Path

The generated DTOs will use `#dtos/*` for relationship imports within the DTOs.
As such, we recommend defining this import path within your `package.json`

```json
"imports": {
  "#dtos/*": "./app/dtos/*.js"
}
```

## Generate DTOs Command

Want to generate DTOs for all your models in one fell swoop? This is the command for you!

```shell
node ace generate:dtos
```

This will read all of your model files, collecting their properties and types.
It'll then convert those property's types into serialization-safe types
and relationships into their DTO representations.

```
File Tree                       Class
------------------------------------------------
└── app/
    ├── dtos/
    │   ├── account.ts          AccountDto
    │   ├── account_group.ts    AccountGroupDto
    │   ├── account_type.ts     AccountTypeDto
    │   ├── income.ts           IncomeDto
    │   ├── payee.ts            PayeeDto
    │   └── user.ts             UserDto
    └── models/
        ├── account.ts          Account
        ├── account_group.ts    AccountGroup
        ├── account_type.ts     AccountType
        ├── income.ts           Income
        ├── payee.ts            Payee
        └── user.ts             User
```

- Gets a list of your model files from the location defined within your `adonisrc.ts` file
- Reads those files as plaintext, filering down to just property definitions
- Determines the property name, it's types, whether it's a relationship, and if it's optionally modified `?`
- Converts those model types into serialized representations (currently a very loose conversion)
  - Note, at present, this does not account for serialization behaviors defined on the model property (like `serializeAs`)
- Creates DTO property definitions from those conversions
- Prepares constructor value setters for each property
- Collects needed imports for relationships
- Generates the DTO file
  - Note, if a file already exists at the DTOs determined location it will be skipped

## Make DTO Command

Want to make a plain DTO file, or a single DTO from a single Model? This is the command for you!

To make a DTO named `AccountDto` within a file located at `dto/account.ts`, we can run the following:

```shell
node ace make:dto account
```

This will check to see if there is a model named `Account`.
If a model is found, it will use that model's property definitions to generate the `AccountDto`.
Otherwise, it'll generate just a `AccountDto` file with an empty class inside it.

```
File Tree                       Class
------------------------------------------------
└── app/
    ├── dtos/
    │   ├── account.ts          AccountDto
    └── models/
        ├── account.ts          Account
```

### What If There Isn't An Account Model?

As mentioned above, a plain `AccountDto` class will be generated within a new `dto/account.ts` file, which will look like the below.

```ts
export default class AccountDto {}
```

#### Specifying A Different Model

If the DTO and Model names don't match, you can specify a specific Model to use via the `--model` flag.

```shell
node ace make:dto account --model=main_account
```

Now instead of looking for a model named `Account` it'll instead
look for `MainAccount` and use it to create a DTO named `AccountDto`.

## BaseDto Helpers

Newly added in v0.0.4, we now include either a `BaseDto` or `BaseModelDto` depeneding on whether we're generating your DTO from a model or not.
Both of these bases include a helper called `fromArray`. With this, you can pass in an array of source objects.
We'll then loop over them and pass each into a new constructor. This does run with the assumption that you'll populate properties within your DTO constructors.

Here's a quick example

```ts
class Test extends BaseModel {
  @column()
  declare id: number
}

class TestDto extends BaseModelDto {
  declare id: number

  constructor(instance: Test) {
    super()
    this.id = instance.id
  }
}

const tests = await Test.createMany([{ id: 1 }, { id: 2 }, { id: 3 }])

const dtoArray = TestDto.fromArray(tests)
// [TestDto, TestDto, TestDto]
```

Additionally, `BaseModelDto` also includes a `fromPaginator` helper. This allows you to pass in an instance of the `ModelPaginator` to be converted into a
`SimplePaginatorDto` we have defined within this package. You can also pass in a URL range start and end and we'll generate those URLs for you during the conversion.

Here's a simple example

```ts
class Test extends BaseModel {
  @column()
  declare id: number
}

class TestDto extends BaseModelDto {
  declare id: number

  constructor(instance: Test) {
    super()
    this.id = instance.id
  }
}

const tests = await Test.createMany([{ id: 1 }, { id: 2 }, { id: 3 }])

const paginator = await Test.query().paginate(1, 2)
const paginatorDto = TestDto.fromPaginator(paginator, { start: 1, end: 2 })
/**
 * {
 *    data: TestDto[],
 *    meta: SimplePaginatorDtoMetaContract
 * }
 */

const paginationUrls = paginatorDto.meta.pagesInRange
/**
 * [
 *    {
 *      url: '/?page=1',
 *      page: 1,
 *      isActive: true
 *    },
 *    {
 *      url: '/?page=2',
 *      page: 2,
 *      isActive: false
 *    },
 * ]
 */
```

If, for example, you're using something like Inertia, you can then type your props accordingly

```ts
import { SimplePaginatorDtoContract } from '@adocasts.com/dto/types'
import DifficultyDto from '#dtos/difficulty'

const props = defineProps<{
  paginated: SimplePaginatorDtoContract<DifficultyDto>
}>()

const rows = props.paginated.data
const info = props.paginated.meta
const urls = props.paginated.meta.pagesInRange
```

## Things To Note

- At present we assume the Model's name from the file name of the model.
- There is NOT currently a setting to change the output directory of the DTOs
- Due to reflection limitations, we're reading Models as plaintext. I'm no TypeScript wiz, so if you know of a better approach, I'm all ears!
  - Since we're reading as plaintext
    - Currently we're omitting decorators and their options

## Example

So, we've use account as our example throughout this guide,
so let's end by taking a look at what this Account Model looks like!

##### The Account Model

```ts
// app/models/account.ts

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
```

It's got

- Column properties
- Nullable properties
- An unmapped property, which also contains a default value
- Getters
- Relationships

Let's see what we get when we generate our DTO!

```shell
node ace make:dto account
```

##### The Account DTO

```ts
import { BaseModelDto } from '@adocasts.com/dto/base'
import Account from '#models/account'
import UserDto from '#dtos/user'
import AccountTypeDto from '#dtos/account_type'
import PayeeDto from '#dtos/payee'
import StockDto from '#dtos/stock'
import TransactionDto from '#dtos/transaction'
import { AccountGroupConfig } from '#config/account'

export default class AccountDto extends BaseModelDto {
  declare id: number
  declare userId: number
  declare accountTypeId: number
  declare name: string
  declare note: string
  declare dateOpened: string | null
  declare dateClosed: string | null
  declare balance: number
  declare startingBalance: number
  declare createdAt: string
  declare updatedAt: string
  aggregations: Record<string, number> = {}
  declare user: UserDto | null
  declare accountType: AccountTypeDto | null
  declare payee: PayeeDto | null
  declare stocks: StockDto[]
  declare transactions: TransactionDto[]
  declare accountGroup: AccountGroupConfig
  declare isCreditIncrease: boolean
  declare isBudgetable: boolean
  declare balanceDisplay: string

  constructor(account?: Account) {
    super()

    if (!account) return
    this.id = account.id
    this.userId = account.userId
    this.accountTypeId = account.accountTypeId
    this.name = account.name
    this.note = account.note
    this.dateOpened = account.dateOpened?.toISO()!
    this.dateClosed = account.dateClosed?.toISO()!
    this.balance = account.balance
    this.startingBalance = account.startingBalance
    this.createdAt = account.createdAt.toISO()!
    this.updatedAt = account.updatedAt.toISO()!
    this.aggregations = account.aggregations
    this.user = account.user && new UserDto(account.user)
    this.accountType = account.accountType && new AccountTypeDto(account.accountType)
    this.payee = account.payee && new PayeeDto(account.payee)
    this.stocks = StockDto.fromArray(account.stocks)
    this.transactions = TransactionDto.fromArray(account.transactions)
    this.accountGroup = account.accountGroup
    this.isCreditIncrease = account.isCreditIncrease
    this.isBudgetable = account.isBudgetable
    this.balanceDisplay = account.balanceDisplay
  }
}
```

It's got the

- Needed imports (it'll try to get them all by also referencing the Model's imports)
- Column properties from our Model
- Nullable property's nullability
- Unmapped property from our Model, plus it's default value
- Relationships converted into DTO representations
- Getters and their types, when specified. If types are inferred, the type will default to string or boolean if variable name starts with `is`
- Constructor value setters for all of the above
- A helper method `fromArray` that'll normalize to an empty array if need be

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adocasts/package-dto/test.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/adocasts/package-dto/actions/workflows/test.yml 'Github action'
[npm-image]: https://img.shields.io/npm/v/@adocasts.com/dto/latest.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@adocasts.com/dto/v/latest 'npm'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[license-url]: LICENSE.md
[license-image]: https://img.shields.io/github/license/adocasts/package-dto?style=for-the-badge
