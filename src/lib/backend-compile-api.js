// backend/routes/compile.js
// Express sunucunuza bunu ekleyin

const express = require('express');
const router = express.Router();

/**
 * POST /api/compile
 * Kodu OnlineCompiler API'ye gönderir ve sonucu döner
 * 
 * Body:
 * {
 *   code: string (çalıştırılacak kod),
 *   compiler: string (python-3.14, nodejs-22, bash-5)
 * }
 */
router.post('/compile', async (req, res) => {
  const { code, compiler } = req.body;

  // Validasyon
  if (!code || !compiler) {
    return res.status(400).json({ 
      error: 'code ve compiler parametreleri gerekli' 
    });
  }

  // İzin verilen diller
  const allowedCompilers = ['python-3.14', 'nodejs-22', 'bash-5'];
  if (!allowedCompilers.includes(compiler)) {
    return res.status(400).json({ 
      error: `Geçersiz compiler. İzin verilenvler: ${allowedCompilers.join(', ')}` 
    });
  }

  try {
    // OnlineCompiler API'ye istek gönder
    const response = await fetch('https://api.onlinecompiler.io/api/run-code-sync/', {
      method: 'POST',
      headers: {
        'Authorization': '54a81b482603efeb0fdbf7ce5784e330',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compiler: compiler,
        code: code,
        input: ""
      })
    });

    // Yanıtı JSON olarak parse et
    const data = await response.json();

    // Başarılı yanıt döndür
    res.json(data);

  } catch (error) {
    console.error('Compile hatası:', error);
    res.status(500).json({ 
      error: error.message || 'Sunucu hatası: Kod çalıştırılamadı'
    });
  }
});

module.exports = router;

// --- KULLANIM ---
// app.js veya index.js dosyasında:
/*
const compileRoutes = require('./routes/compile');
app.use('/api', compileRoutes);

// CORS ayarlanması (Capacitor uygulaması için)
const cors = require('cors');
app.use(cors({
  origin: '*', // Veya spesifik domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
*/
