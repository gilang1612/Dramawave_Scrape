/**
 * Dramawave API Scraper
 * Based on captured network traffic from api.mydramawave.com
 * Created from convertsw.my.id
 *
 * Usage: node dramawave-scraper.js
 */

const https = require('https');
const http = require('http');
const zlib = require('zlib');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  baseUrl: 'https://api.mydramawave.com',
  country: 'ID',
  language: 'id-ID',
  appVersion: '1.7.70',
  appName: 'com.dramawave.app',

  // Device identifiers (from captured traffic)
  deviceId: '93beeb3b-a48e-4ca9-9554-c3922ee3643c',
  userId: '144435308',

  // OAuth tokens (from captured traffic)
  oauth: {
    token: '9aNBgtDeegKchAbnUYjyTHV9Q3kZ1saz',
    signature: '5233915f1670282b4b9cd69a4f7ae74b'
  },

  // A/B experiment IDs (from captured traffic)
  abExps: '962:3245,970:3269,988:3322,437:1326,1009:3398,955:3219,883:2927,534:1611,972:3277,983:3307,544:1646,807:2618,966:3258,996:3345,953:3209,980:3297,984:3309,648:2011,617:1901,960:3239,929:3115,731:2310,987:3321,697:2196,961:3243,971:3272,991:3330,967:3262,205:552,973:3278,963:3249,477:1441'
};

// ============================================
// SESSION STATE
// ============================================
class Session {
  constructor() {
    this.sessionId = this.generateUuid();
    this.firebaseId = this.generateFirebaseId();
    this.appsflyerId = `${Date.now()}-${this.generateRandomId(19)}`;
    this.gaId = this.generateUuid();
    this.timestamp = Date.now();
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateFirebaseId() {
    return this.generateRandomId(32);
  }

  generateRandomId(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getTimestamp() {
    return Date.now().toString();
  }
}

// ============================================
// HTTP CLIENT
// ============================================
class HttpClient {
  static async request(options, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.url);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;

      const requestOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      if (body) {
        const bodyData = JSON.stringify(body);
        requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
      }

      const req = lib.request(requestOptions, (res) => {
        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          let data = buffer;

          // Handle gzip encoding
          if (res.headers['content-encoding'] === 'gzip') {
            try {
              data = zlib.gunzipSync(buffer);
            } catch (e) {
              console.error('⚠️ Gunzip error:', e.message);
            }
          }

          try {
            const json = JSON.parse(data.toString('utf-8'));
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: json
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data.toString('utf-8')
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('❌ Request error:', e.message);
        reject(e);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

// ============================================
// DRAMAWAVE API CLIENT
// ============================================
class DramawaveAPI {
  constructor() {
    this.session = new Session();
  }

  /**
   * Build common headers for all requests
   */
  buildHeaders() {
    const timestamp = this.session.getTimestamp();
    const headers = {
      'Host': 'api.mydramawave.com',
      'Connection': 'Keep-Alive',
      'Accept-Encoding': 'gzip',
      'User-Agent': 'okhttp/4.12.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json',

      // Device info
      'country': CONFIG.country,
      'timezone': '+7',
      'device-country': CONFIG.country,
      'language': CONFIG.language,
      'device-id': CONFIG.deviceId,
      'device-memory': '7.28',
      'device-language': CONFIG.language,
      'device-version': '36',
      'screen-width': '360',
      'screen-height': '812',
      'x-device-brand': 'OPPO',
      'x-device-product': 'PLJ110',
      'x-device-model': 'ASUS_AI2401_A',
      'x-device-manufacturer': 'Asus',
      'x-device-fingerprint': 'OPPO/PLJ110/OP5E17L1:16/BP2A.250605.015/B.53fe372-338cc21-3391320:user/release-keys',

      // App info
      'app-name': CONFIG.appName,
      'app-version': CONFIG.appVersion,
      'is-mainland': 'false',
      'mcc-country': '510',
      'device': 'android',
      'network-type': 'no_permission',

      // Tracking IDs
      'X-Appsflyer_Id': this.session.appsflyerId,
      'gaid': this.session.gaId,
      'appsflyer-id': this.session.appsflyerId,
      'firebase-id': this.session.firebaseId,
      'session-id': this.session.sessionId,

      // A/B Testing
      'Ab-Exps': CONFIG.abExps,

      // Authorization
      'Authorization': `oauth_signature=${CONFIG.oauth.signature},oauth_token=${CONFIG.oauth.token},ts=${timestamp}`
    };

    return headers;
  }

  /**
   * 1. HOMEPAGE - Get popular banner content
   * @param {number} pageNum - Page number
   * @param {number} pageSize - Items per page
   */
  async getHomepage(pageNum = 1, pageSize = 10) {
    const url = `${CONFIG.baseUrl}/dm-api/homepage/v2/tab/index`;
    const params = new URLSearchParams({
      tab_key: '678',
      position_index: ((pageNum - 1) * pageSize).toString(),
      rec_trigger: '1'
    });

    console.log(`📱 Fetching Homepage (page=${pageNum})...`);

    const response = await HttpClient.request({
      url: `${url}?${params}`,
      method: 'GET',
      headers: this.buildHeaders()
    });

    return this.parseHomepage(response.data);
  }

  /**
   * Parse homepage response
   */
  parseHomepage(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid homepage response');
      return null;
    }

    const items = [];

    for (const module of data.data.items || []) {
      if (module.type === 'banner') {
        for (const item of module.items || []) {
          items.push({
            key: item.key,
            title: item.title,
            cover: item.cover,
            description: item.desc,
            tags: item.content_tags || [],
            episodeCount: item.episode_count,
            followCount: item.follow_count,
            episode: item.episode_info ? {
              id: item.episode_info.id,
              name: item.episode_info.name,
              duration: item.episode_info.duration,
              h264Url: item.episode_info.external_audio_h264_m3u8,
              h265Url: item.episode_info.external_audio_h265_m3u8,
              subtitles: (item.episode_info.subtitle_list || []).map(sub => ({
                language: sub.language,
                name: sub.display_name,
                srtUrl: sub.subtitle,
                vttUrl: sub.vtt
              }))
            } : null,
            link: item.link
          });
        }
      }
    }

    console.log(`✅ Found ${items.length} banner items`);
    return items;
  }

  /**
   * 2. ANIME HOMEPAGE - Get anime/comics content
   * @param {number} pageNum - Page number
   * @param {number} pageSize - Items per page
   */
  async getAnimeHomepage(pageNum = 1, pageSize = 10) {
    const url = `${CONFIG.baseUrl}/dm-api/homepage/v2/tab/index`;
    const params = new URLSearchParams({
      tab_key: '499',
      position_index: ((pageNum - 1) * pageSize).toString(),
      rec_trigger: '1'
    });

    console.log(`🎬 Fetching Anime Homepage (page=${pageNum})...`);

    const response = await HttpClient.request({
      url: `${url}?${params}`,
      method: 'GET',
      headers: this.buildHeaders()
    });

    return this.parseAnimeHomepage(response.data);
  }

  /**
   * Parse anime homepage response
   */
  parseAnimeHomepage(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid anime homepage response');
      return null;
    }

    const items = [];

    for (const module of data.data.items || []) {
      if (module.type === 'recommend') {
        for (const item of module.items || []) {
          items.push({
            key: item.key,
            title: item.title,
            cover: item.cover,
            description: item.desc,
            tags: item.tag || [],
            seriesTags: item.series_tag || [],
            contentTags: item.content_tags || [],
            episodeCount: item.episode_count,
            followCount: item.follow_count,
            episode: item.episode_info ? {
              id: item.episode_info.id,
              name: item.episode_info.name,
              duration: item.episode_info.duration,
              h264Url: item.episode_info.external_audio_h264_m3u8,
              h265Url: item.episode_info.external_audio_h265_m3u8,
              subtitles: (item.episode_info.subtitle_list || []).map(sub => ({
                language: sub.language,
                name: sub.display_name,
                srtUrl: sub.subtitle,
                vttUrl: sub.vtt
              }))
            } : null,
            link: item.link
          });
        }
      }
    }

    console.log(`✅ Found ${items.length} anime items`);
    return items;
  }

  /**
   * 3. HOTLIST - Get trending content
   */
  async getHotlist() {
    const url = `${CONFIG.baseUrl}/dm-api/search/hot-list`;

    console.log('🔥 Fetching Hotlist...');

    const response = await HttpClient.request({
      url: url,
      method: 'POST',
      headers: this.buildHeaders()
    }, {});

    return this.parseHotlist(response.data);
  }

  /**
   * Parse hotlist response
   */
  parseHotlist(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid hotlist response');
      return null;
    }

    const items = [];

    for (const item of data.data.items || []) {
      items.push({
        id: item.id,
        name: item.name,
        description: item.desc,
        cover: item.cover,
        tags: item.series_tag || [],
        contentTags: item.content_tags || [],
        episodeCount: item.episode_count,
        viewCount: item.view_count,
        followCount: item.follow_count,
        commentCount: item.comment_count,
        hotScore: item.hot_score,
        performers: item.performers || [],
        isFree: item.free,
        episode: item.episode ? {
          id: item.episode.id,
          name: item.episode.name,
          duration: item.episode.duration,
          h264Url: item.episode.external_audio_h264_m3u8,
          h265Url: item.episode.external_audio_h265_m3u8,
          subtitles: (item.episode.subtitle_list || []).map(sub => ({
            language: sub.language,
            name: sub.display_name,
            url: sub.subtitle
          }))
        } : null
      });
    }

    console.log(`✅ Found ${items.length} trending items`);
    return items;
  }

  /**
   * 4. HOTWORDS - Get trending search terms
   */
  async getHotwords() {
    const url = `${CONFIG.baseUrl}/dm-api/search/hot_words`;

    console.log('🔍 Fetching Hotwords...');

    const response = await HttpClient.request({
      url: url,
      method: 'GET',
      headers: this.buildHeaders()
    });

    return this.parseHotwords(response.data);
  }

  /**
   * Parse hotwords response
   */
  parseHotwords(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid hotwords response');
      return null;
    }

    const hotwords = data.data.hot_words || [];
    console.log(`✅ Found ${hotwords.length} trending searches`);

    return hotwords.map(hw => ({
      word: hw.word,
      recallScore: hw.r_info ? JSON.parse(hw.r_info).recall_score : null
    }));
  }

  /**
   * 5. DRAMA INFO - Get detailed drama information
   * @param {string} seriesId - Drama series ID
   */
  async getDramaInfo(seriesId) {
    const url = `${CONFIG.baseUrl}/dm-api/drama/info_v2`;
    const params = new URLSearchParams({
      series_id: seriesId,
      clip_content: ''
    });

    console.log(`📺 Fetching Drama Info (seriesId=${seriesId})...`);

    const response = await HttpClient.request({
      url: `${url}?${params}`,
      method: 'GET',
      headers: this.buildHeaders()
    });

    return this.parseDramaInfo(response.data);
  }

  /**
   * Parse drama info response
   */
  parseDramaInfo(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid drama info response');
      return null;
    }

    const info = data.data.info || {};

    return {
      id: info.id,
      name: info.name,
      description: info.desc,
      cover: info.cover,
      tags: info.tag || [],
      contentTags: info.content_tags || [],
      episodeCount: info.episode_count,
      followCount: info.follow_count,
      commentCount: info.comment_count,
      isFree: info.free,
      episodes: (info.episode_list || []).map(ep => ({
        id: ep.id,
        name: ep.name,
        cover: ep.cover,
        duration: ep.duration,
        index: ep.index,
        h264Url: ep.external_audio_h264_m3u8,
        h265Url: ep.external_audio_h265_m3u8,
        subtitles: (ep.subtitle_list || []).map(sub => ({
          language: sub.language,
          name: sub.display_name,
          srtUrl: sub.subtitle,
          vttUrl: sub.vtt
        }))
      }))
    };
  }

  /**
   * 6. SEARCH - Search for dramas
   * @param {string} keyword - Search keyword
   * @param {string} next - Pagination token (optional)
   */
  async search(keyword, next = '') {
    const url = `${CONFIG.baseUrl}/dm-api/search/drama`;

    console.log(`🔎 Searching for "${keyword}"...`);

    const body = {
      next: next,
      keyword: keyword,
      timestamp: this.session.getTimestamp()
    };

    const response = await HttpClient.request({
      url: url,
      method: 'POST',
      headers: this.buildHeaders()
    }, body);

    return this.parseSearch(response.data);
  }

  /**
   * Parse search response
   */
  parseSearch(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid search response');
      return null;
    }

    const pageInfo = data.data.page_info || {};
    const items = [];

    for (const item of data.data.items || []) {
      items.push({
        id: item.id,
        name: item.name,
        description: item.desc,
        cover: item.cover,
        tags: item.series_tag || [],
        contentTags: item.content_tags || [],
        episodeCount: item.episode_count,
        viewCount: item.view_count,
        followCount: item.follow_count,
        hotScore: item.hot_score,
        isFree: item.free,
        bestMatch: item.best_match_flag === 1,
        highlight: item.highlight || null,
        episode: item.episode ? {
          id: item.episode.id,
          duration: item.episode.duration,
          h264Url: item.episode.external_audio_h264_m3u8,
          h265Url: item.episode.external_audio_h265_m3u8
        } : null
      });
    }

    console.log(`✅ Found ${items.length} results (hasMore: ${pageInfo.has_more})`);

    return {
      items: items,
      pageInfo: {
        next: pageInfo.next,
        hasMore: pageInfo.has_more
      }
    };
  }

  /**
   * 7. SEARCH KEYWORDS - Get search suggestions
   * @param {string} keyword - Search keyword for suggestions
   */
  async getSearchKeywords(keyword) {
    const url = `${CONFIG.baseUrl}/dm-api/search/keywords`;
    const params = new URLSearchParams({
      keyword: keyword
    });

    console.log(`💡 Fetching Search Keywords for "${keyword}"...`);

    const response = await HttpClient.request({
      url: `${url}?${params}`,
      method: 'GET',
      headers: this.buildHeaders()
    });

    return this.parseSearchKeywords(response.data);
  }

  /**
   * Parse search keywords response
   */
  parseSearchKeywords(data) {
    if (!data || data.code !== 200 || !data.data) {
      console.error('❌ Invalid search keywords response');
      return null;
    }

    const keywords = data.data.keywords || [];
    console.log(`✅ Found ${keywords.length} keyword suggestions`);

    return keywords.map(kw => ({
      keyword: kw.keyword,
      highlight: kw.highlight
    }));
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Dramawave API Scraper              ║');
  console.log('║     api.mydramawave.com                ║');
  console.log('╚════════════════════════════════════════╝\n');

  const api = new DramawaveAPI();

  try {
    // 1. Get Homepage (Popular)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const homepage = await api.getHomepage(1, 10);
    if (homepage && homepage.length > 0) {
      console.log('\n📋 Sample Homepage Item:');
      console.log(JSON.stringify(homepage[0], null, 2));
    }

    // 2. Get Anime Homepage
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const animeHomepage = await api.getAnimeHomepage(1, 10);
    if (animeHomepage && animeHomepage.length > 0) {
      console.log('\n📋 Sample Anime Item:');
      console.log(JSON.stringify(animeHomepage[0], null, 2));
    }

    // 3. Get Hotlist
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const hotlist = await api.getHotlist();
    if (hotlist && hotlist.length > 0) {
      console.log('\n📋 Sample Hotlist Item:');
      console.log(JSON.stringify(hotlist[0], null, 2));
    }

    // 4. Get Hotwords
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const hotwords = await api.getHotwords();
    if (hotwords) {
      console.log('\n📋 Trending Searches:');
      hotwords.slice(0, 5).forEach((hw, i) => {
        console.log(`   ${i + 1}. ${hw.word}`);
      });
    }

    // 5. Search Example
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const searchResults = await api.search('Ceo');
    if (searchResults && searchResults.items.length > 0) {
      console.log('\n📋 Sample Search Result:');
      console.log(JSON.stringify(searchResults.items[0], null, 2));
    }

    // 6. Get Search Keywords
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const searchKeywords = await api.getSearchKeywords('kaisar');
    if (searchKeywords) {
      console.log('\n📋 Search Keyword Suggestions:');
      searchKeywords.slice(0, 5).forEach((kw, i) => {
        console.log(`   ${i + 1}. ${kw.keyword}`);
      });
    }

    // 7. Get Drama Detail (using first hotlist item)
    if (hotlist && hotlist.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      const dramaInfo = await api.getDramaInfo(hotlist[0].id);
      if (dramaInfo) {
        console.log('\n📋 Drama Details:');
        console.log(JSON.stringify({
          ...dramaInfo,
          episodes: dramaInfo.episodes.slice(0, 3) // Show first 3 episodes
        }, null, 2));
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ All operations completed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  DramawaveAPI,
  CONFIG,
  Session,
  HttpClient
};
