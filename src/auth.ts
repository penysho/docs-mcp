import { authenticate } from "@google-cloud/local-auth";
import * as fs from "fs";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import * as path from "path";
import * as process from "process";

// スコープの定義
const SCOPES = [
	"https://www.googleapis.com/auth/documents",
	"https://www.googleapis.com/auth/drive",
];

// トークンパスの定義
const TOKEN_PATH = path.join(process.cwd(), "token.json");
// 認証情報パスの定義
const CREDENTIALS_PATH =
	process.env.GOOGLE_APPLICATION_CREDENTIALS ||
	path.join(process.cwd(), "credentials.json");

/**
 * 保存されたトークン情報を読み込みます
 */
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
	try {
		const content = await fs.promises.readFile(TOKEN_PATH, "utf-8");
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials) as OAuth2Client;
	} catch (err) {
		return null;
	}
}

/**
 * トークンを保存します
 */
async function saveCredentials(client: OAuth2Client): Promise<void> {
	const content = await fs.promises.readFile(CREDENTIALS_PATH, "utf-8");
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Google APIの認証を行います
 */
export async function authorize(): Promise<OAuth2Client> {
	let client = await loadSavedCredentialsIfExist();
	if (client) {
		return client;
	}

	client = (await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	})) as OAuth2Client;

	if (client.credentials) {
		await saveCredentials(client);
	}

	return client;
}

/**
 * Google Docs APIのクライアントを取得します
 */
export async function getDocsClient() {
	const auth = await authorize();
	return google.docs({ version: "v1", auth });
}

/**
 * Google Drive APIのクライアントを取得します
 */
export async function getDriveClient() {
	const auth = await authorize();
	return google.drive({ version: "v3", auth });
}
