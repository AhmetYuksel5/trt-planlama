import assert from "node:assert/strict";
import { test } from "node:test";
import { findItemIstegi, getItemIstegi, createItemIstegi, findItemCoz, getItemCoz, grubaUygun, yeniMetin, faultMetni, httpCerceveCoz, postalariCek, postalariCekOtomatik, postaGonderOtomatik, ekIndirOtomatik, ekListesiCoz, ekIcerikCoz, imidBulIstegi, type Soket, type EwsAyar } from "../src/ews.ts";

/*
 * EWS istemcisinin saf parçaları (SOAP kurucu/çözücü, gövde temizleme, HTTP
 * çerçeve çözme) ve sahte soketle NTLM el sıkışması + çekme sırası. Ağ yok.
 */

const GERCEK_TYPE2 = "TlRMTVNTUAACAAAABgAGADgAAAAFgokCHgJCAGTJSh4AAAAAAAAAAKwArAA+AAAACgB8TwAAAA9UAFIAVAACAAYAVABSAFQAAQAWAFQAUgBUAFMAMAA2AEUAWABDAEgAMwAEABwAaQBuAHQALgB0AHIAdAAuAG4AZQB0AC4AdAByAAMANABUAFIAVABTADAANgBFAFgAQwBIADMALgBpAG4AdAAuAHQAcgB0AC4AbgBlAHQALgB0AHIABQAcAGkAbgB0AC4AdAByAHQALgBuAGUAdAAuAHQAcgAHAAgA7eIoRa1u3QEAAAAA";

test("FindItem isteği gelen kutusunu en yeni önce istiyor", () => {
  const x = findItemIstegi(25);
  assert.ok(x.includes('DistinguishedFolderId Id="inbox"'));
  assert.ok(x.includes('MaxEntriesReturned="25"'));
  // SortOrder çıkarıldı (EWS "The request is invalid" veriyordu); sıralama istemcide.
  assert.ok(!x.includes("SortOrder"));
});

test("GetItem isteği düz metin gövde ve gerekli alanları istiyor", () => {
  const x = getItemIstegi([{ id: "AAA", degisim: "CK1" }]);
  assert.ok(x.includes("<t:BaseShape>AllProperties</t:BaseShape>"));
  assert.ok(x.includes("<t:BodyType>Text</t:BodyType>"));
  assert.ok(!x.includes("AdditionalProperties"));
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

test("CreateItem isteği: gönderilip kopyalanır, konu/gövde/alıcı XML'de", () => {
  const x = createItemIstegi({ kime: ["planning@trtarabi.com"], konu: "RE: <selam>", metin: "merhaba & hoşçakal" });
  assert.ok(x.includes('MessageDisposition="SendAndSaveCopy"'));
  assert.ok(x.includes("<t:Body BodyType=\"Text\">merhaba &amp; hoşçakal</t:Body>"));
  assert.ok(x.includes("RE: &lt;selam&gt;"));
  assert.ok(x.includes("<t:EmailAddress>planning@trtarabi.com</t:EmailAddress>"));
  assert.ok(!x.includes("CcRecipients") && !x.includes("BccRecipients"), "boş CC/BCC yazılmıyor");
});

test("CreateItem isteği: birden çok alıcı, CC ve BCC şemanın sırasıyla", () => {
  const x = createItemIstegi({ kime: ["a@trt.net.tr", "b@trt.net.tr"], cc: ["planning@trtarabi.com"], bcc: ["gizli@trt.net.tr"], konu: "k", metin: "m" });
  const to = x.indexOf("<t:ToRecipients>"), cc = x.indexOf("<t:CcRecipients>"), bcc = x.indexOf("<t:BccRecipients>");
  assert.ok(to > 0 && cc > to && bcc > cc, "sıra To, Cc, Bcc");
  assert.equal((x.match(/<t:Mailbox>/g) ?? []).length, 4);
  assert.ok(x.slice(cc, bcc).includes("planning@trtarabi.com"));
  assert.ok(x.slice(bcc).includes("gizli@trt.net.tr"));
});

test("postaGonderOtomatik: el sıkışması + CreateItem başarı", async () => {
  const ayar: EwsAyar = { sunucu: "posta.trt.net.tr", kullanici: "u", parola: "p", alan: "TRT" };
  const auth = `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\nWWW-Authenticate: Negotiate\r\n`;
  const basari = `<m:CreateItemResponse><m:ResponseMessages><m:CreateItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode></m:CreateItemResponseMessage></m:ResponseMessages></m:CreateItemResponse>`;
  const { soket } = sahteSoket([`HTTP/1.1 401 Unauthorized\r\n${auth}Content-Length: 0\r\n\r\n`, httpYanit("200 OK", basari)]);
  const r = await postaGonderOtomatik(ayar, async () => soket, Date.now(), { kime: ["a@trt.net.tr"], konu: "RE: x", metin: "selam" });
  assert.ok("tamam" in r && r.tamam, JSON.stringify(r));
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
  assert.deepEqual(m.kime, ["planning@trtarabi.com", "x@trt.net.tr"]);
  assert.deepEqual(m.cc, []);
  assert.equal(grubaUygun(m, "planning@trtarabi.com"), true);
  assert.equal(grubaUygun(m, "baska@trtarabi.com"), false);
  assert.equal(grubaUygun(m, ""), true, "boş grupta hepsi geçer");
});

test("To ve Cc ayrı okunuyor (kim kime yazdı)", () => {
  const xml =
    `<t:Message><t:Subject>k</t:Subject><t:Body BodyType="Text">x</t:Body>` +
    `<t:From><t:Mailbox><t:EmailAddress>omar@trt.net.tr</t:EmailAddress></t:Mailbox></t:From>` +
    `<t:ToRecipients><t:Mailbox><t:EmailAddress>Ali@trt.net.tr</t:EmailAddress></t:Mailbox></t:ToRecipients>` +
    `<t:CcRecipients><t:Mailbox><t:EmailAddress>planning@trtarabi.com</t:EmailAddress></t:Mailbox><t:Mailbox><t:EmailAddress>veli@trt.net.tr</t:EmailAddress></t:Mailbox></t:CcRecipients>` +
    `</t:Message>`;
  const m = getItemCoz(xml)[0];
  assert.deepEqual(m.kime, ["ali@trt.net.tr"]);
  assert.deepEqual(m.cc, ["planning@trtarabi.com", "veli@trt.net.tr"]);
  assert.equal(grubaUygun(m, "planning@trtarabi.com"), true, "CC'deki grup da süzgeçten geçer");
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

/* --- Ek indirme (kurgusal posta ve dosya) --- */

test("ek: Message-ID ile arama, ek listesi ve içerik çözülüyor", () => {
  const x = imidBulIstegi("<abc@ornek.test>");
  assert.ok(x.includes('FieldURI="message:InternetMessageId"') && x.includes('Value="&lt;abc@ornek.test&gt;"') && x.includes('Id="inbox"'));
  assert.ok(x.indexOf("Restriction") < x.indexOf("ParentFolderIds"), "şema sırası: Restriction önce");
  const liste = ekListesiCoz(`<t:Attachments><t:FileAttachment><t:AttachmentId Id="EK1"/><t:Name>işe giriş bildirgesi.pdf</t:Name><t:Size>1234</t:Size></t:FileAttachment><t:ItemAttachment><t:AttachmentId Id="IT"/><t:Name>ileti</t:Name></t:ItemAttachment></t:Attachments>`);
  assert.deepEqual(liste, [{ id: "EK1", ad: "işe giriş bildirgesi.pdf", boyut: 1234 }]);
  const veri = new Uint8Array([0, 1, 2, 250, 255, 60, 62]);
  const xml = `<m:Attachments><t:FileAttachment><t:Name>a.pdf</t:Name><t:ContentType>application/pdf</t:ContentType><t:ContentId>x</t:ContentId><t:Content>${Buffer.from(veri).toString("base64")}</t:Content></t:FileAttachment></m:Attachments>`;
  const c = ekIcerikCoz(new TextEncoder().encode(xml));
  assert.equal(c?.tur, "application/pdf");
  assert.deepEqual([...c!.veri], [...veri]);
});

test("ekIndirOtomatik: el sıkışması, arama, liste, GetAttachment (parça parça gelen chunked yanıt)", async () => {
  const ayar: EwsAyar = { sunucu: "posta.ornek.test", kullanici: "u", parola: "p", alan: "ORNEK" };
  const dosya = new Uint8Array(200_000).map((_, i) => (i * 7) % 256);
  const ekXml = `<m:GetAttachmentResponse><t:FileAttachment><t:Name>bordro.xlsx</t:Name><t:ContentType>application/vnd.ms-excel</t:ContentType><t:Content>${Buffer.from(dosya).toString("base64")}</t:Content></t:FileAttachment></m:GetAttachmentResponse>`;
  // Chunked gövde, 16 KB'lık soket okumalarına bölünmüş: okuyucu tamamlanınca çözmeli.
  const parcala = (s: string, n: number) => Array.from({ length: Math.ceil(s.length / n) }, (_, i) => s.slice(i * n, (i + 1) * n));
  const chunkli = `HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n` + parcala(ekXml, 30_000).map((p) => `${Buffer.byteLength(p).toString(16)}\r\n${p}\r\n`).join("") + "0\r\n\r\n";
  const okumalar = [
    httpYanit("401 Unauthorized", "", `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\n`),
    httpYanit("200 OK", `<t:Message><t:ItemId Id="IT1" ChangeKey="CK"/></t:Message>`),
    httpYanit("200 OK", `<t:Attachments><t:FileAttachment><t:AttachmentId Id="EK9"/><t:Name>bordro.xlsx</t:Name><t:Size>200000</t:Size></t:FileAttachment></t:Attachments>`),
    ...parcala(chunkli, 16_384),
  ];
  const { soket, istekler } = sahteSoket(okumalar);
  const r = await ekIndirOtomatik(ayar, async () => soket, Date.now(), "abc@ornek.test", "bordro.xlsx");
  assert.ok("veri" in r, JSON.stringify(r).slice(0, 200));
  assert.equal(r.tur, "application/vnd.ms-excel");
  assert.equal(r.veri.length, dosya.length);
  assert.deepEqual(r.veri.subarray(0, 50), dosya.subarray(0, 50));
  assert.ok(istekler[1].includes("InternetMessageId") && istekler[2].includes("item:Attachments") && istekler[3].includes('AttachmentId Id="EK9"'));
});

test("ekIndirOtomatik: posta kutuda yoksa 'yok'", async () => {
  const ayar: EwsAyar = { sunucu: "posta.ornek.test", kullanici: "u", parola: "p", alan: "ORNEK" };
  const { soket } = sahteSoket([httpYanit("401 Unauthorized", "", `WWW-Authenticate: NTLM ${GERCEK_TYPE2}\r\n`), httpYanit("200 OK", `<m:FindItemResponse><t:Items/></m:FindItemResponse>`)]);
  const r = await ekIndirOtomatik(ayar, async () => soket, Date.now(), "yok@ornek.test", "a.pdf");
  assert.ok("hata" in r && r.yok);
});
