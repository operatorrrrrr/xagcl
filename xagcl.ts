import fs from "fs"

enum AccountType {
	Xbox = "xbox",
	XboxPlus = "xbox_plus",
	XboxDemand = "xbox_demand"
}

interface AccountResponse {
	account: {
		email: string,
		password: string,
		username: string,
		type: AccountType
	},
	test_mode_enabled: boolean
}

interface CoinsResponse {
	coins: number
}

interface StockResponse {
	accounts: number,
	plus_accounts: number,
	normal_accounts: number
}

function get_token(): string {
	const config = require("./config.json")

	if (config["token"]) {
		return config["token"]
	}

	throw new Error("You need to put your token in config.json")
}

async function generate_account(type: AccountType, test_mode: boolean = false) {
	return fetch(`https://xag.fly.dev/api/generate?type=${type}&test_mode=${test_mode}`, {
		method: "POST",
		headers: {
			"api-token": get_token()
		}
	})
}

async function fetch_stock() {
	return fetch(`https://xag.fly.dev/api/stock`, {})
}

async function get_stock(): Promise<StockResponse> {
	const stock: StockResponse = await (await fetch_stock()).json() as StockResponse

	return stock
}

function stock_to_string(stock: StockResponse): string {
	return `┌ → Total accounts: ${stock.accounts}\n│ → Regular accounts: ${stock.normal_accounts}\n└ → xag+ accounts: ${stock.plus_accounts}`
}


const RED_FG: string = "\x1b[31m"
const GREEN_FG: string = "\x1b[32m"
const RESET: string = "\x1b[0m"

function pause() {
	console.log("\nPress ctrl+c to exit")

	setTimeout(() => {
		process.exit(0)
	}, 60000000)
}

(async () => {
	const use_plus: boolean = process.argv.includes("plus")
	const on_demand: boolean = process.argv.includes("on_demand")

	const test_mode: boolean = process.argv.includes("test")

	let type: AccountType = AccountType.Xbox

	if (use_plus) {
		type = AccountType.XboxPlus
	}

	if (on_demand) {
		type = AccountType.XboxDemand
	}

	const stock: StockResponse = await get_stock()

	console.log("? Settings: ")
	console.log("┌ → Test mode: " + test_mode)
	console.log("└ → Account type: " + type)

	console.log("")

	console.log("? Stock:")
	console.log(stock_to_string(stock))
	console.log("")

	generate_account(AccountType.Xbox, test_mode)
		.then(async response => {
			const account = (await response.json()) as AccountResponse

			if (account["message"]) {
				console.error(RED_FG + "✘ Failed to generate an account: " + account["message"] + RESET)
				return pause()
			}

			console.log(GREEN_FG + "✔  Account created!" + RESET)
			console.log(GREEN_FG + "┌ → Email: " + account.account.email + RESET)
			console.log(GREEN_FG + "│ → Password: " + account.account.password + RESET)
			console.log(GREEN_FG + "└ → Username: " + account.account.username + RESET)

			fs.appendFileSync(`accounts.txt`, `${account.account.email} | ${account.account.password} | ${account.account.username}\n`)

			pause()
		})
		.catch(error => {
			console.error(RED_FG + "✘ Error: " + error.message + RESET)
			pause()
		})
})()
