# Dramawave API Scraper

Node.js scraper untuk Dramawave API berdasarkan captured network traffic. Script ini memungkinkan Anda untuk mengambil data dari platform Dramawave termasuk drama populer, trending, pencarian, dan detail episode.

> ⚠️ **Disclaimer**: Script ini dibuat untuk tujuan edukasi dan penelitian. Gunakan dengan bijak dan hormati Terms of Service dari Dramawave.

---

## 📋 Fitur

- ✅ **Homepage** - Ambil banner drama populer
- ✅ **Anime/Comics** - Ambil konten anime dan komik
- ✅ **Hotlist** - Dapatkan drama trending
- ✅ **Hotwords** - Kata kunci pencarian populer
- ✅ **Search** - Cari drama dengan keyword
- ✅ **Drama Info** - Detail lengkap drama + semua episode
- ✅ **Multi-language Subtitles** - 22+ bahasa subtitle termasuk Indonesia
- ✅ **Dual Video Quality** - H264 & H265 m3u8 URLs
- ✅ **OAuth Authentication** - Support authentication header

---

## 🚀 Instalasi

### Prerequisites

- Node.js >= 14.x
- npm atau yarn

### Langkah Instalasi

```bash
# Clone repository ini
https://github.com/gilang1612/Dramawave_Scrape.git
cd dramawave_scrape

# Install dependencies (tidak ada external dependencies, hanya Node.js built-in modules)
# Tidak perlu install apapun!
```

---

## 📖 Cara Penggunaan

### Basic Usage

```bash
node dramawave-scraper.js
```

### Sebagai Module

```javascript
const { DramawaveAPI } = require('./dramawave-scraper');

async function main() {
  const api = new DramawaveAPI();
  
  // Get homepage (popular dramas)
  const homepage = await api.getHomepage();
  console.log(homepage);
  
  // Get anime content
  const anime = await api.getAnimeHomepage();
  console.log(anime);
  
  // Get trending dramas
  const hotlist = await api.getHotlist();
  console.log(hotlist);
  
  // Get trending search words
  const hotwords = await api.getHotwords();
  console.log(hotwords);
  
  // Search drama
  const results = await api.search('CEO');
  console.log(results);
  
  // Get drama detail
  const drama = await api.getDramaInfo('series_id_here');
  console.log(drama);
  
  // Get search keyword suggestions
  const keywords = await api.getSearchKeywords('kaisar');
  console.log(keywords);
}

main();
```

---

## 📚 API Methods

### 1. `getHomepage(pageNum, pageSize)`

Mengambil drama populer dari homepage.

```javascript
const homepage = await api.getHomepage(1, 10);
// Returns: Array of drama objects
```

### 2. `getAnimeHomepage(pageNum, pageSize)`

Mengambil konten anime/comics.

```javascript
const anime = await api.getAnimeHomepage(1, 10);
// Returns: Array of anime objects
```

### 3. `getHotlist()`

Mengambil daftar drama trending.

```javascript
const hotlist = await api.getHotlist();
// Returns: Array of trending drama objects
```

### 4. `getHotwords()`

Mengambil kata kunci pencarian populer.

```javascript
const hotwords = await api.getHotwords();
// Returns: Array of hotword objects
```

### 5. `search(keyword, next)`

Mencari drama berdasarkan keyword.

```javascript
const results = await api.search('CEO');
// Returns: Object with items array and pageInfo
```

### 6. `getDramaInfo(seriesId)`

Mengambil detail lengkap drama termasuk semua episode.

```javascript
const drama = await api.getDramaInfo('xiKVPnVT6C');
// Returns: Drama detail object with episodes array
```

### 7. `getSearchKeywords(keyword)`

Mengambil saran kata kunci pencarian.

```javascript
const keywords = await api.getSearchKeywords('kaisar');
// Returns: Array of keyword suggestion objects
```

---

## ⚙️ Konfigurasi

Edit bagian `CONFIG` di dalam file `dramawave-scraper.js`:

```javascript
const CONFIG = {
  baseUrl: 'https://api.mydramawave.com',
  country: 'ID',
  language: 'id-ID',
  appVersion: '1.7.70',
  appName: 'com.dramawave.app',
  
  // Device identifiers
  deviceId: 'your-device-id',
  
  // OAuth tokens (dari captured traffic)
  oauth: {
    token: 'your-oauth-token',
    signature: 'your-oauth-signature'
  },
  
  // A/B experiment IDs
  abExps: 'your-ab-exps'
};
```

---

## 📦 Struktur Response

### Homepage Item

```json
{
  "key": "h1AYCRi3oe",
  "title": "Ratu Delta Force Kembali",
  "cover": "https://...",
  "description": "...",
  "tags": ["Identitas Rahasia"],
  "episodeCount": 53,
  "followCount": 1588,
  "episode": {
    "id": "6BTkgUlXs2",
    "duration": 193,
    "h264Url": "https://...",
    "h265Url": "https://...",
    "subtitles": [
      {
        "language": "id-ID",
        "name": "Indonesia",
        "srtUrl": "https://...",
        "vttUrl": "https://..."
      }
    ]
  }
}
```

### Search Result

```json
{
  "id": "Q6tgglcx7E",
  "name": "Dimanjakan CEO Dingin",
  "bestMatch": true,
  "highlight": {
    "title": "Dimanjakan {{CEO}} Dingin",
    "content_tags": ["{{CEO}}", "Cinta Setelah Nikah"]
  },
  "episode": {
    "h264Url": "https://...",
    "h265Url": "https://..."
  }
}
```

---

## 🔐 Authentication

Script ini menggunakan OAuth authentication header yang didapat dari captured network traffic:

```
Authorization: oauth_signature=<signature>,oauth_token=<token>,ts=<timestamp>
```

**Catatan**: OAuth tokens mungkin expired setelah beberapa waktu. Anda perlu melakukan capture ulang untuk mendapatkan token baru.

---

## 🛠️ Development

### Menambahkan Method Baru

```javascript
async function getNewFeature() {
  const url = `${CONFIG.baseUrl}/dm-api/new-endpoint`;
  
  const response = await HttpClient.request({
    url: url,
    method: 'GET',
    headers: this.buildHeaders()
  });
  
  return response.data;
}
```

### Debug Mode

Untuk melihat response mentah dari API, tambahkan logging di method `parse*`:

```javascript
parseHomepage(data) {
  console.log('Response:', JSON.stringify(data, null, 2));
  // ... rest of code
}
```

---

## ⚠️ Catatan Penting

1. **OAuth Tokens** - Token authentication mungkin expired dan perlu di-refresh dari capture baru
2. **Rate Limiting** - Jangan melakukan terlalu banyak request dalam waktu singkat
3. **Terms of Service** - Pastikan penggunaan Anda sesuai dengan ToS Dramawave
4. **Educational Purpose** - Script ini dibuat untuk tujuan pembelajaran

---

## 📝 Contoh Output

```
╔════════════════════════════════════════╗
║     Dramawave API Scraper              ║
║     api.mydramawave.com                ║
╚════════════════════════════════════════╝

📱 Fetching Homepage (page=1)...
✅ Found 9 banner items

📋 Sample Homepage Item:
{
  "key": "h1AYCRi3oe",
  "title": "Ratu Delta Force Kembali",
  "episodeCount": 53,
  ...
}

🔥 Fetching Hotlist...
✅ Found 20 trending items

🔍 Fetching Hotwords...
✅ Found 12 trending searches

📋 Trending Searches:
   1. Ibu Tiri Tangguh Dari Masa Lampau
   2. Hidup Kedua, Tak Lagi Bodoh Soal Cinta
   3. Dendam Sang Ibu Buta
   ...

✅ All operations completed!
```

---

## 📄 License

MIT License - Silakan digunakan dan dimodifikasi sesuai kebutuhan.

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat pull request atau issue untuk perbaikan dan fitur baru.

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository GitHub ini.

---

**Happy Scraping! 🎬**
