// Firebase'in "Password reset" e-posta şablonunu depodaki metinle eşitler.
//
// Davet e-postası bu şablonla gidiyor (depo/firebase.ts → baglantiGonder):
// ücretsiz planda giriş bağlantısı günde 5, şifre sıfırlama 150. "Şifremi
// unuttum" da aynı şablonu kullandığı için metin iki duruma da uyuyor.
// Konsolda elle değiştirmek yerine burada: yayın işi her gönderimde eşitliyor.
//
// Kullanım: GOOGLE_APPLICATION_CREDENTIALS=<hizmet hesabı anahtarı> node araclar/eposta-sablonu.mjs
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const PROJE = "planners-flow-2026";

const SABLON = {
  senderDisplayName: "Plannersflow",
  subject: "Set your Plannersflow password",
  bodyFormat: "HTML",
  body: [
    "<p>Hello,</p>",
    "<p>Use the link below to set the password for your Plannersflow account (%EMAIL%).</p>",
    "<p>If you were invited to Plannersflow, this activates your account. If you asked to reset your password, this sets a new one.</p>",
    "<p><a href='%LINK%'>Set your password</a></p>",
    "<p>After setting your password, sign in with your email address and your new password.</p>",
    "<p>If you did not expect this email, you can ignore it.</p>",
    "<p>Plannersflow</p>",
  ].join(""),
};

const b64 = (x) => Buffer.from(x).toString("base64url");

/* Hizmet hesabıyla erişim anahtarı: kitaplıksız, imzalı JWT ile. */
const erisimAnahtari = async (a) => {
  const simdi = Math.floor(Date.now() / 1000);
  const govde = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(
    JSON.stringify({ iss: a.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: simdi, exp: simdi + 600 }),
  )}`;
  const imza = createSign("RSA-SHA256").update(govde).sign(a.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${govde}.${imza}` }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.log(`::error::Erişim anahtarı alınamadı: ${j.error ?? ""} ${j.error_description ?? ""}`);
    process.exit(1);
  }
  return j.access_token;
};

const anahtar = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
const jeton = await erisimAnahtari(anahtar);
const r = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJE}/config?updateMask=notification.sendEmail.resetPasswordTemplate`, {
  method: "PATCH",
  headers: { authorization: `Bearer ${jeton}`, "content-type": "application/json", "x-goog-user-project": PROJE },
  body: JSON.stringify({ notification: { sendEmail: { resetPasswordTemplate: SABLON } } }),
});
const j = await r.json();
if (!r.ok) {
  console.log(`::error::Şablon güncellenemedi (${r.status}): ${JSON.stringify(j.error ?? j)}`);
  process.exit(1);
}
const t = j.notification?.sendEmail?.resetPasswordTemplate ?? {};
console.log(`Şablon güncellendi: "${t.subject}" · gönderen "${t.senderDisplayName}"`);
