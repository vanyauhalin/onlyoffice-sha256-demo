// @ts-check

import { log } from "node:console"
import { createHash, createHmac } from "node:crypto"
import { createReadStream, createWriteStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join } from "node:path"
import { env } from "node:process"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url))

const documentServerBaseURL = env["DOCUMENT_SERVER_BASE_URL"]
if (!documentServerBaseURL) {
  throw new Error("DOCUMENT_SERVER_BASE_URL environment variable is required")
}

const serverBaseURL = env["SERVER_BASE_URL"]
if (!serverBaseURL) {
  throw new Error("SERVER_BASE_URL environment variable is required")
}

const serverPort = env["SERVER_PORT"]
if (!serverPort) {
  throw new Error("SERVER_PORT environment variable is required")
}

const serverJWTHeader = env["SERVER_JWT_HEADER"]
if (!serverJWTHeader) {
  throw new Error("SERVER_JWT_HEADER environment variable is required")
}

const serverJWTSecret = env["SERVER_JWT_SECRET"]
if (!serverJWTSecret) {
  throw new Error("SERVER_JWT_SECRET environment variable is required")
}

const serverHostname = env["SERVER_HOSTNAME"]
if (!serverHostname) {
  throw new Error("SERVER_HOSTNAME environment variable is required")
}

function main() {
  const server = createServer()

  server.on("request", async (req, res) => {
    switch (req.url) {
      case "/start":
        log("Start with the following env variables.")
        log("DOCUMENT_SERVER_BASE_URL", documentServerBaseURL)
        log("SERVER_BASE_URL", serverBaseURL)
        log("SERVER_PORT", serverPort)
        log("SERVER_JWT_HEADER", serverJWTHeader)
        log("SERVER_JWT_SECRET", serverJWTSecret)
        log("SERVER_HOSTNAME", serverHostname, "\n")
        log("Start with the document.docx.")
        const f0 = testdata("document.docx")
        const s = await stat(f0)
        const h = await sha256(f0)
        log(`${s.size} ${h}\n`)
        await process("document.docx", "result.docxf")
        await process("result.docxf", "result.docx")
        res.end()
        break
      case "/document.docx":
        const f1 = testdata("document.docx")
        await send(res, f1, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        break
      case "/result.docxf":
        const f2 = testdata("result.docxf")
        await send(res, f2, "application/vnd.openxmlformats-officedocument.wordprocessingml.document.docxf")
        break
    }
  })

  server.listen(Number(serverPort), serverHostname, async () => {
    log("When the Document Server is ready, run the following command.\n")
    log('  curl http://localhost:3000/start\n')
  })
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {Promise<void>}
 */
async function process(from, to) {
  log(`Start converting the ${from} to the ${to}.`)
  const o = await convert({
    async: false,
    filetype: extname(from).slice(1),
    key: from,
    outputtype: extname(to).slice(1),
    title: to,
    url: `${serverBaseURL}${from}`
  })
  log(`${JSON.stringify(o)}\n`)
  log(`Start downloading the ${to}.`)
  const f = testdata(to)
  await download(o.fileUrl, f)
  const s = await stat(f)
  const h = await sha256(f)
  log(`${s.size} ${h}\n`)
}

/**
 * @param {any} b
 * @returns {Promise<any>}
 */
async function convert(b) {
  const method = "POST"
  const u = `${documentServerBaseURL}ConvertService.ashx`
  const body = JSON.stringify(b)
  log(`${method} ${u} ${body}`)
  const res = await fetch(u, {
    method,
    body,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${encode(serverJWTSecret, body)}`
    }
  })
  return await res.json()
}

/**
 * @param {string} u
 * @param {string} f
 * @returns {Promise<void>}
 */
async function download(u, f) {
  const s = createWriteStream(f)
  const method = "GET"
  log(`${method} ${u}`)
  const res = await fetch(u, { method })
  await finished(Readable.fromWeb(res.body).pipe(s))
}

/**
 * @param {any} res
 * @param {string} f
 * @param {string} t
 */
async function send(res, f, t) {
  const s = await stat(f)
  res.statusCode = 200
  res.setHeader("Content-Type", t)
  res.setHeader("Content-Length", s.size)
  createReadStream(f).pipe(res)
}

/**
 * @param {string} n
 * @returns {string}
 */
function testdata(n) {
  return join(root, "testdata", n)
}

/**
 * @param {string} f
 * @returns {Promise<string>}
 */
function sha256(f) {
  return new Promise((res, rej) => {
    const h = createHash("sha256")
    const s = createReadStream(f)
    s.on("data", (data) => {
      h.update(data)
    })
    s.on("end", () => {
      res(h.digest("hex"))
    })
    s.on("error", rej)
  })
}

/**
 * @param {string} secret
 * @param {string} body
 * @return {string}
 */
function encode(secret, body) {
  const header = {
    "alg": "HS256",
    "typ": "JWT"
  }
  const h = base64UrlEncode(JSON.stringify(header))
  const b = base64UrlEncode(body)
  const signInput = h + "." + b
  let sign = createHmac("sha256", secret).update(signInput).digest("base64")
  sign = sign.replace("+", "-").replace("/", "_").replace(/=+$/, "")
  return signInput + "." + sign
  /**
   * @param {string} s
   * @returns {string}
   */
  function base64UrlEncode(s) {
    let base64 = Buffer.from(s).toString("base64")
    return base64.replace("+", "-").replace("/", "_").replace(/=+$/, "")
  }
}

main()
