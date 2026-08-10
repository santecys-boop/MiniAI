import http.client

conn = http.client.HTTPSConnection("judge0-ce.p.rapidapi.com")

headers = {
    'x-rapidapi-key': "ad9c0d8cb1mshf8715b30f7d7328p1bb1b1jsn204c129c511f",
    'x-rapidapi-host': "judge0-ce.p.rapidapi.com",
    'Content-Type': "application/json"
}

# Sunucu özellikleri için /about endpoint'ine GET isteği atıyoruz
conn.request("GET", "/about", headers=headers)

res = conn.getresponse()
data = res.read().decode("utf-8")

print("--- WEB SUNUCUSU DONANIM BİLGİLERİ ---")
print(data)
