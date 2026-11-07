import assert from "node:assert/strict";
import { test } from "node:test";
import { findItemIstegi, getItemIstegi, findItemCoz, getItemCoz, grubaUygun, yeniMetin, faultMetni, httpCerceveCoz, postalariCek, postalariCekOtomatik, type Soket, type EwsAyar } from "../src/ews.ts";

/*
 * EWS istemcisinin saf parçaları (SOAP kurucu/çözücü, gövde temizleme, HTTP
 * çerçeve çözme) ve sahte soketle NTLM el sıkışması + çekme sırası. Ağ yok.
 */

const GERCEK_TYPE2 = "TlRMTVNTUAACAAAABgAGADgAAAAFgokCHgJCAGTJSh4AAAAAAAAAAKwArAA+AAAACgB8TwAAAA9UAFIAVAACAAYAVABSAFQAAQAWAFQAUgBUAFMAMAA2AEUAWABDAEgAMwAEABwAaQBuAHQALgB0AHIAdAAuAG4AZQB0AC4AdAByAAMANABUAFIAVABTADAANgBFAFgAQwBIADMALgBpAG4AdAAuAHQAcgB0AC4AbgBlAHQALgB0AHIABQAcAGkAbgB0AC4AdAByAHQALgBuAGUAdAAuAHQAcgAHAAgA7eIoRa1u3QEAAAAA";

test("FindItem isteği gelen kutusunu en yeni önce istiyor", () => {
  const x = findItemIstegi(25);
  assert.ok(x.includes('DistinguishedFolderId Id="inbox"'));
  assert.ok(x.includes('MaxEntriesReturned="25"'));
  assert.ok(x.includes('Order="Descending"'));
});

test("GetItem isteği düz metin gövde ve gerekli alanları istiyor", () => {
  const x = getItemIstegi([{ id: "AAA", degisim: "CK1" }]);
  assert.ok(x.includes("<t:BodyType>Text</t:BodyType>"));
  assert.ok(x.includes('FieldURI="message:ConversationId"'));
  assert.ok(x.includes('Id="AAA"') && x.includes('ChangeKey="CK1"'));
});

test("FindItem yanıtı kimliklere çözülüyor", () => {
  const xml = `<m:Items><t:Message><t:ItemId Id="ID1" ChangeKey="CK1"/></t:Message><t:Message><t:ItemId Id="ID2" ChangeKey="CK2"/></t:Message></m:Items>`;
  const idler = findItemCoz(xml);
  assert.equal(idler.length, 2);
  assert.deepEqual(idler[0], { id: "ID1", degisim: "CK1" });
});

test("GetItem yanıtı mesaja çözülüyor; alıntı ayıklanıyor, ekler ad olarak", () => {
  const govde = "Yarın Gazze'den paket önerim var.\n\nOn Mon, 3 Nov 2026 at 10:00, Planlama &lt;planning@trt.net.tr&gt; wrote:\n&gt; eski";
  const xml =
    `<m:GetItemResponse><m:ResponseMessages><m:GetItemResponseMessage ResponseClass="Success"><m:Items>` +
    `<t:Message>` +
    `<t:Subject>RE: Gazze önerisi</t:Subject>` +
    `<t:DateTimeReceived>2026-11-03T10:05:00Z</t:DateTimeReceived>` +
    `<t:Body BodyType="Text">${govde}</t:Body>` +
    `<t:InternetMessageId>&lt;abc123@trt.net.tr&gt;</t:InternetMessageId>` +
    `<t:ConversationId Id="CONV99"/>` +
    `<t:From><t:Mailbox><t:Name>Omar Haddad</t:Name><t:EmailAddress>omar@trt.net.tr</t:EmailAddress></t:Mailbox></t:From>` +
    `<t:Attachments><t:FileAttachment><t:Name>brief.pdf</t:Name></t:FileAttachment></t:Attachments>` +
    `</t:Message></m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse>`;
  const m = getItemCoz(xml);
  assert.equal(m.length, 1);
  assert.equal(m[0].kimden, "omar@trt.net.tr");
  assert.equal(m[0].kimdenAd, "Omar Haddad");
  assert.equal(m[0].konu, "RE: Gazze önerisi");
  assert.equal(m[0].konuKimligi, "CONV99");
  assert.equal(m[0].mesajKimligi, "abc123@trt.net.tr");
  assert.deepEqual(m[0].ekler, ["brief.pdf"]);
  assert.ok(m[0].metin.includes("paket önerim var"));
  assert.ok(!m[0].metin.includes("wrote:") && !m[0].metin.includes("eski"), "alıntı ayıklandı");
  assert.ok(m[0].tamMetin.includes("wrote:"), "tam metin korunuyor");
});

test("faultMetni: SOAP fault ve EWS MessageText çıkarılıyor", () => {
  assert.match(faultMetni("<soap:Fault><faultstring>The request failed schema validation</faultstring></soap:Fault>"), /schema validation/);
  assert.match(faultMetni('<m:ResponseCode>ErrorInvalidServerVersion</m:ResponseCode>'), /ErrorInvalidServerVersion/);
  assert.match(faultMetni("<html><body>Server Error</body></html>"), /Server Error/);
});

test("grup adresi süzgeci: To/Cc'de grup adresi arıyor", () => {
  const xml =
    `<t:Message><t:Subject>k</t:Subject><t:Body BodyType="Text">x</t:Body>` +
    `<t:From><t:Mailbox><t:EmailAddress>omar@trt.net.tr</t:EmailAddress></t:Mailbox></t:From>` +
    `<t:ToRecipients><t:Mailbox><t:EmailAddress>Planning@trtarabi.com</t:EmailAddress></t:Mailbox><t:Mailbox><t:EmailAddress>x@trt.net.tr</t:EmailAddress></t:Mailbox></t:ToRecipients>` +
    `</t:Message>`;
  const m = getItemCoz(xml)[0];
  assert.deepEqual(m.alicilar, ["planning@trtarabi.com", "x@trt.net.tr"]);
  assert.equal(grubaUygun(m, "planning@trtarabi.com"), true);
  assert.equal(grubaUygun(m, "baska@trtarabi.com"), false);
  assert.equal(grubaUygun(m, ""), true, "boş grupta hepsi geçer");
});

test("gövde temizleme Arapça imzayı da atıyor", () => {
  assert.equal(yeniMetin("اقتراح مهم\n\nأُرسلت من هاتفي"), "اقتراح مهم");
});

test("HTTP çerçeve: content-length", () => {
  const ham = new TextEncoder().encode("HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nhello");
  const y = httpCerceveCoz(ham);
  assert.equal(y?.durum, 200);
  assert.equal(new TextDecoder().decode(y!.govde), "hello");
});

test("HTTP çerçeve: yinelenen WWW-Authenticate birleşiyor (NTLM Negotiate'in altında kaybolmasın)", () => {
  const ham = new TextEncoder().encode("HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: NTLM TlRMTVNTUAAC\r\nWWW-Authenticate: Negotiate\r\nContent-Length: 0\r\n\r\n");
  const y = httpCerceveCoz(ham);
  assert.equal(y?.durum, 401);
  assert.match(y!.basliklar["www-authenticate"], /NTLM TlRMTVNTUAAC/);
});

test("HTTP çerçeve: chunked ve eksik veride null", () => {
  assert.equal(httpCerceveCoz(new TextEncoder().encode("HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nkisa")), null);
  const chunked = "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n4\r\nWiki\r\n5\r\npedia\r\n0\r\n\r\n";
  const y = httpCerceveCoz(new TextEncoder().encode(chunked));
  assert.equal(new TextDecoder().decode(y!.govde), "Wikipedia");
});

/* Sahte soket: sıradaki HTTP yanıtlarını döndürür, yazılan istekleri kaydeder. */
const sahteSoket = (yanitlar: string[]): { soket: Soket; istekler: string[] } => {
  const istekler: string[] = [];
  let i = 0;
  const soket: Soket = {
    yaz: async (u) => { istekler.push(new TextDecoder().decode(u)); },
    oku: async () => (i < yanitlar.length ? new TextEncoder().encode(yanitlar[i++]) : null),
    kapat: async () => {},
  };
  return { soket, istekler };
};

const httpYanit = (durum: string, govde: string, ekBaslik = ""): string => {
  const b = new TextEncoder().encode(govde);
  return `HTTP/1.1 ${durum}\r\n${ekBaslik}Content-Length: ${b.length}\r\n\r\n${govde}`;
};

test("postalariCek: NTLM el sıkışması (Type1→401→Type3→200) ve GetItem", async () => {
  const ayar: EwsAyar = { sunucu: "posta.trt.net.tr", kullanici: "mehmetsafa.bicer", parola: "sahte", alan: "TRT" };
  const findXml = `<t:Message><t:ItemId Id="ID1" ChangeKey="CK1"/></t:Message>`;
  const getXml = `<t:Message><t:Subject>Deneme</t:Subject><t:Body BodyType="Text">merhaba</t:Body><t:From><t:Mailbox><t:EmailAddress>a@trt.net.tr</t:EmailAddress></t:Mailbox></t:From></t:Message>`;
  const { soket, istekler } = sahteSoket([
    // Gerçek Exchange 401'i gibi: NTLM challenge'ın ardından ayrı bir Negotiate satırı.
    httpYanit("401 Unauthorized", "", `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\nWWW-Authenticate: Negotiate\r\n`),
    httpYanit("200 OK", findXml),
    httpYanit("200 OK", getXml),
  ]);
  const sonuc = await postalariCek(ayar, async () => soket, Date.UTC(2026, 10, 7), 25);
  assert.ok("mesajlar" in sonuc, "hata değil: " + JSON.stringify(sonuc));
  assert.equal(sonuc.mesajlar.length, 1);
  assert.equal(sonuc.mesajlar[0].kimden, "a@trt.net.tr");
  // İlk istek Type1, ikinci Type3 (handshake), üçüncü GetItem (handshake yok).
  assert.ok(istekler[0].includes("Authorization: NTLM TlRMTVNTUAABAAAA"), "Type1 gönderildi");
  assert.ok(istekler[1].includes("Authorization: NTLM TlRMTVNTUAADAAAA"), "Type3 gönderildi");
  assert.ok(istekler[2].includes("GetItem") && !istekler[2].includes("Authorization: NTLM TlRMTVNTUAAB"), "GetItem aynı bağlantıda, yeni handshake yok");
});

test("postalariCekOtomatik: MIC'siz kimlik reddedilince MIC'li yeni bağlantıda yeniden dener", async () => {
  const ayar: EwsAyar = { sunucu: "posta.trt.net.tr", kullanici: "mehmetsafa.bicer", parola: "p", alan: "TRT" };
  const findXml = `<t:Message><t:ItemId Id="ID1" ChangeKey="CK1"/></t:Message>`;
  const getXml = `<t:Message><t:Subject>x</t:Subject><t:Body BodyType="Text">m</t:Body><t:From><t:Mailbox><t:EmailAddress>a@trt.net.tr</t:EmailAddress></t:Mailbox></t:From></t:Message>`;
  const auth = `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\nWWW-Authenticate: Negotiate\r\n`;
  let baglanti = 0;
  const baglan = async () => {
    baglanti++;
    // İlk bağlantı (MIC'siz): Type3 sonrası 401 (reddedildi). İkinci (MIC'li): 401 challenge → 200 → 200.
    return baglanti === 1
      ? sahteSoket([httpYanit("401 Unauthorized", "", auth), httpYanit("401 Unauthorized", "", auth)]).soket
      : sahteSoket([httpYanit("401 Unauthorized", "", auth), httpYanit("200 OK", findXml), httpYanit("200 OK", getXml)]).soket;
  };
  const sonuc = await postalariCekOtomatik(ayar, baglan, Date.now(), 25);
  assert.ok("mesajlar" in sonuc && sonuc.mesajlar.length === 1, "MIC'li ikinci denemede bağlandı");
  assert.equal(baglanti, 2, "iki bağlantı denendi");
});

test("postalariCek: 500 yanıtı bağlantı sıfırlanınca da fault metnini veriyor", async () => {
  const ayar: EwsAyar = { sunucu: "posta.trt.net.tr", kullanici: "u", parola: "p", alan: "TRT" };
  const auth = `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\nWWW-Authenticate: Negotiate\r\n`;
  const fault = "<soap:Fault><faultstring>ErrorInternalServerError</faultstring></soap:Fault>";
  // 500'ün Content-Length'i gövdeden büyük (eksik), ardından soket sıfırlanıyor (oku → null).
  const eksik500 = `HTTP/1.1 500 Internal Server Error\r\nContent-Length: 9999\r\n\r\n${fault}`;
  const { soket } = sahteSoket([`HTTP/1.1 401 Unauthorized\r\n${auth}Content-Length: 0\r\n\r\n`, eksik500]);
  const sonuc = await postalariCek(ayar, async () => soket, Date.now(), 25);
  assert.ok("hata" in sonuc && /500/.test(sonuc.hata) && /ErrorInternalServerError/.test(sonuc.hata), "500 ve fault metni: " + JSON.stringify(sonuc));
});

test("postalariCek: yanlış kimlikte 401 → hata metni", async () => {
  const ayar: EwsAyar = { sunucu: "posta.trt.net.tr", kullanici: "x", parola: "y", alan: "TRT" };
  const { soket } = sahteSoket([
    httpYanit("401 Unauthorized", "", `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\n`),
    httpYanit("401 Unauthorized", "", `WWW-Authenticate: NTLM\r\n`),
  ]);
  const sonuc = await postalariCek(ayar, async () => soket, Date.now(), 25);
  assert.ok("hata" in sonuc && sonuc.hata.includes("doğrulanamadı"));
});
