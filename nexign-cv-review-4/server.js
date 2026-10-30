// Nexign CV Review — сервер без внешних зависимостей (Node.js 18+)
// Запуск: node server.js  →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dns = require("dns").promises;

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const DB_FILE = path.join(DATA_DIR, "applications.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(12).toString("hex");

const DIRECTIONS = ["Менеджмент", "Развитие бизнеса", "Техническое сопровождение"];
const MAX_FILE = 10 * 1024 * 1024;
const MAX_BODY = 15 * 1024 * 1024; // файл уходит в base64, это примерно на треть больше
const REVIEW_DAYS = 14;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/* ---------------- «база данных» в JSON ---------------- */
let applications = [];
try { applications = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (_) { applications = []; }

let writeChain = Promise.resolve();
function persist() {
  // запись по очереди + атомарная замена файла, чтобы не повредить базу
  writeChain = writeChain.then(async () => {
    const tmp = DB_FILE + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(applications, null, 2), "utf8");
    await fs.promises.rename(tmp, DB_FILE);
  });
  return writeChain;
}

/* ---------------- проверка email ---------------- */
const POPULAR_DOMAINS = ["gmail.com","mail.ru","yandex.ru","ya.ru","outlook.com","hotmail.com","yahoo.com","icloud.com","bk.ru","list.ru","inbox.ru","rambler.ru","nexign.com","proton.me","protonmail.com","live.com","me.com"];
const VALID_EXTRA_DOMAINS = ["yandex.com","yandex.by","yandex.kz","yandex.ua","mail.com","yahoo.co.uk","yahoo.fr","yahoo.de","yahoo.it","yahoo.es","yahoo.co.jp","hotmail.co.uk","hotmail.fr","hotmail.de","outlook.fr","outlook.de","live.ru","live.co.uk","googlemail.com","pm.me","mail.ua","ro.ru"];
const BRAND_LABELS = ["gmail","yandex","outlook","hotmail","yahoo","icloud","rambler","nexign"];

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[a.length][b.length];
}

function checkEmail(email) {
  if (email.length > 254) return "Email слишком длинный.";
  const m = /^([^\s@]+)@([^\s@]+)$/.exec(email);
  if (!m) return "Введите корректный email.";
  const local = m[1], domain = m[2].toLowerCase();
  if (local.length > 64 || /^\.|\.$|\.\./.test(local) || !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local))
    return "Email содержит недопустимые символы до знака @.";
  const labels = domain.split(".");
  const labelOk = l => l.length >= 1 && l.length <= 63 && /^[\p{L}\p{N}-]+$/u.test(l) && !l.startsWith("-") && !l.endsWith("-");
  if (labels.length < 2 || !labels.every(labelOk) || !/^\p{L}{2,24}$/u.test(labels[labels.length - 1]))
    return "Укажите корректный домен почты, например name@company.com.";
  if (!POPULAR_DOMAINS.includes(domain) && !VALID_EXTRA_DOMAINS.includes(domain)) {
    for (const p of POPULAR_DOMAINS) {
      const limit = p.length <= 8 ? 1 : 2;
      const sameBrand = BRAND_LABELS.includes(labels[0]) && labels[0] === p.split(".")[0];
      if (sameBrand || lev(domain, p) <= limit)
        return `Похоже, в домене опечатка: «${domain}». Возможно, вы имели в виду ${local}@${p}.`;
    }
  }
  return null;
}

// Существует ли домен (MX/A-записи). true / false / null (проверить не удалось — не блокируем)
const withTimeout = p => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "ETIMEOUT" }), 3000))]);
const isMissing = e => e && (e.code === "ENOTFOUND" || e.code === "ENODATA");
async function lookupDomain(domain) {
  try {
    const mx = await withTimeout(dns.resolveMx(domain));
    if (mx && mx.length) return true;
  } catch (e) { if (!isMissing(e)) return null; }
  try {
    const a = await withTimeout(dns.resolve4(domain));
    return a.length > 0;
  } catch (e) { return isMissing(e) ? false : null; }
}
async function domainExists(domain) {
  if (POPULAR_DOMAINS.includes(domain) || VALID_EXTRA_DOMAINS.includes(domain)) return true;
  const res = await lookupDomain(domain);
  if (res !== false) return res;
  // Если не открывается даже заведомо живой домен — значит, DNS на сервере недоступен, а не адрес неверный
  const canary = await lookupDomain("gmail.com");
  return canary === true ? false : null;
}

/* ---------------- утилиты ---------------- */
function formatRu(date) {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error("too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function isAdmin(req, url) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("token");
  if (!token) return false;
  const a = Buffer.from(token), b = Buffer.from(ADMIN_TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// простейшее ограничение частоты: 10 заявок в час с одного IP
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), hour = 3600 * 1000;
  const arr = (hits.get(ip) || []).filter(t => now - t < hour);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 10;
}

function detectFileType(buf) {
  if (buf.slice(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (buf[0] === 0x50 && buf[1] === 0x4b) return "docx";
  if (buf.slice(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))) return "doc";
  return null;
}

/* ---------------- API ---------------- */
async function createApplication(req, res) {
  if (rateLimited(req.socket.remoteAddress)) return sendJson(res, 429, { errors: ["Слишком много заявок. Попробуйте позже."] });

  let data;
  try { data = JSON.parse(await readBody(req)); }
  catch (e) {
    if (e.status === 413) return sendJson(res, 413, { errors: ["Файл слишком большой."], fields: ["file"] });
    return sendJson(res, 400, { errors: ["Некорректный запрос."] });
  }

  const errors = [], fields = [];
  const fail = (field, msg) => { errors.push(msg); if (field && !fields.includes(field)) fields.push(field); };

  const name = String(data.name || "").trim().replace(/\s+/g, " ");
  const email = String(data.email || "").trim();
  const directions = Array.isArray(data.directions) ? [...new Set(data.directions)] : [];

  if (name.split(" ").length < 2 || name.length > 200) fail("name", "Укажите ФИО полностью.");
  const emailErr = checkEmail(email);
  if (emailErr) fail("email", emailErr);
  if (!directions.length || !directions.every(d => DIRECTIONS.includes(d))) fail("dir", "Выберите хотя бы одно направление стажировки.");
  if (data.consent !== true) fail(null, "Необходимо согласие на обработку персональных данных.");

  let fileBuf = null, ext = null;
  const origName = String(data.fileName || "").slice(0, 200);
  if (typeof data.fileData !== "string" || !data.fileData) {
    fail("file", "Прикрепите файл с резюме.");
  } else {
    fileBuf = Buffer.from(data.fileData, "base64");
    if (fileBuf.length === 0) fail("file", "Файл пустой.");
    else if (fileBuf.length > MAX_FILE) fail("file", "Размер файла не должен превышать 10 МБ.");
    else {
      ext = detectFileType(fileBuf);
      const nameExt = (path.extname(origName).slice(1) || "").toLowerCase();
      if (ext !== "pdf" || nameExt !== "pdf") fail("file", "Резюме нужно загрузить в формате PDF.");
    }
  }

  if (!emailErr) {
    const exists = await domainExists(email.split("@")[1].toLowerCase());
    if (exists === false) fail("email", "Домен почты не существует. Проверьте адрес.");
  }

  if (errors.length) return sendJson(res, 422, { errors, fields });

  const id = crypto.randomUUID();
  const storedName = `${id}.${ext}`;
  await fs.promises.writeFile(path.join(UPLOADS_DIR, storedName), fileBuf);

  const createdAt = new Date();
  const expected = new Date(createdAt.getTime() + REVIEW_DAYS * 86400000);
  const record = {
    id,
    createdAt: createdAt.toISOString(),
    status: "new",
    name,
    email: email.toLowerCase(),
    directions,
    consent: { given: true, at: createdAt.toISOString() },
    subscribe: data.subscribe === true,
    resume: { originalName: origName.replace(/[\\/:*?"<>|\r\n]/g, "_"), storedName, size: fileBuf.length },
    expectedDate: expected.toISOString().slice(0, 10),
    expectedDateRu: formatRu(expected)
  };
  applications.push(record);
  await persist();

  sendJson(res, 201, { id, expectedDate: record.expectedDateRu });
}

/* ---------------- статика ---------------- */
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Не найдено"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

/* ---------------- сервер ---------------- */
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/applications") return await createApplication(req, res);

    if (req.method === "GET" && url.pathname === "/api/applications") {
      if (!isAdmin(req, url)) return sendJson(res, 401, { error: "Нужен токен администратора" });
      return sendJson(res, 200, applications);
    }

    const fm = /^\/api\/applications\/([0-9a-f-]{36})\/resume$/.exec(url.pathname);
    if (req.method === "GET" && fm) {
      if (!isAdmin(req, url)) return sendJson(res, 401, { error: "Нужен токен администратора" });
      const rec = applications.find(a => a.id === fm[1]);
      if (!rec) return sendJson(res, 404, { error: "Не найдено" });
      const buf = await fs.promises.readFile(path.join(UPLOADS_DIR, rec.resume.storedName));
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(rec.resume.originalName)}`
      });
      return res.end(buf);
    }

    if (url.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "Не найдено" });
    if (req.method === "GET") return serveStatic(req, res, url);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { errors: ["Ошибка сервера. Попробуйте позже."] });
  }
}).listen(PORT, () => {
  console.log(`Сайт:       http://localhost:${PORT}`);
  console.log(`Отклики:    ${DB_FILE}`);
  console.log(`Резюме:     ${UPLOADS_DIR}`);
  console.log(`Токен админа (для GET /api/applications): ${ADMIN_TOKEN}`);
});
