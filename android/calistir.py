import requests

# Doğru API URL'si
url = "https://rapidapi.com"

# Arka planda çalışacak kod
kullanici_kodu = """
import zipfile
with open("notlar.txt", "w") as f:
    f.write("Uygulama basariyla calisti!")
with zipfile.ZipFile("sivi.zip", "w") as z:
    z.write("notlar.txt")
print("Zip dosyasi ve icerik basariyla uretildi!")
"""

payload = {
    "language_id": 71,
    "source_code": kullanici_kodu,
    "stdin": ""
}

headers = {
    "content-type": "application/json",
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    "x-rapidapi-key": "ad9c0d8cb1mshf8715b30f7d7328p1bb1b1jsn204c129c511f"
}

# İsteği atıyoruz
response = requests.post(url, json=payload, headers=headers)
sonuc = response.json()

print("--- SUNUCUDAN DÖNEN SONUÇ ---")
print("Kod Çıktısı (stdout):", sonuc.get("stdout"))
print("Kullanılan RAM (Hafıza):", sonuc.get("memory"), "KB")
print("Hata Mesajı (stderr):", sonuc.get("stderr"))
