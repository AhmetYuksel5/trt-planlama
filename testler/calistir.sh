#!/usr/bin/env bash
# Uçtan uca testler: derlenmiş docs/ önizlemede (npx vite preview --port 4173) açıkken koşar.
# PW: playwright modülünün yolu; OUT: ekran görüntülerinin klasörü.
set -u
cd "$(dirname "$0")"
export PW="${PW:-playwright}" OUT="${OUT:-/tmp}"
kalan=0
for t in *.cjs; do
  sonuc=$(timeout 1800 node "$t" 2>&1 | tail -1)
  echo "$t: $sonuc"
  case "$sonuc" in *" 0 kaldı"*) ;; *) kalan=1 ;; esac
done
exit $kalan
