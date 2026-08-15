// Virtual In-Browser Module Resolver & Runtime Compiler for Multi-File React SaaS Apps
import { ProjectFile } from "../types";

export interface VirtualSandboxConfig {
  files: ProjectFile[];
  projectName?: string;
  databaseQueries?: string[];
  initialRoute?: string;
}

export function buildVirtualSandboxBundle(config: VirtualSandboxConfig): string {
  const { files, projectName = "Mini SaaS Application", databaseQueries = [], initialRoute = "/" } = config;

  // Sanal Dosya Tablosu (Path -> Content)
  const fileMap: Record<string, string> = {};
  files.forEach(f => {
    const normPath = f.path.replace(/^\.?\//, "").replace(/^src\//, "");
    fileMap[normPath] = f.content;
    fileMap[f.path] = f.content;
  });

  const filesJson = JSON.stringify(fileMap);
  const sqlJson = JSON.stringify(databaseQueries);

  return `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#fbf8f2',
              100: '#f5efe3',
              200: '#ebdeca',
              300: '#dec7a8',
              400: '#d1ad82',
              500: '#c59560',
              600: '#b78051',
              700: '#986542',
              800: '#7c5339',
              900: '#654430',
              950: '#372217',
            }
          }
        }
      }
    }
  </script>

  <!-- React 18 & ReactDOM 18 UMD -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  
  <!-- Babel Standalone for JSX & ESNext compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- FontAwesome for robust Lucide/icon emulation -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #09090b;
      color: #fafafa;
      overflow-x: hidden;
    }
    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #18181b; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #71717a; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
  <div id="root">
    <div class="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <div class="text-xs font-mono text-zinc-400">Sanal Full-Stack SaaS Ortamı Başlatılıyor...</div>
    </div>
  </div>

  <script type="text/babel">
    const { 
      useState, useEffect, useReducer, useRef, useMemo, useCallback, 
      createContext, useContext, forwardRef, memo, Fragment 
    } = React;

    // 1. Sanal Dosya Sistemi
    window.__VFS__ = ${filesJson};
    window.__SQL_QUERIES__ = ${sqlJson};
    window.__MODULE_CACHE__ = {};

    // 2. Sanal Lucide İkon Proxy Motoru (Tüm Lucide ikonlarını otomatik render eder)
    const LucideIcons = new Proxy({}, {
      get: (target, prop) => {
        return function LucideIconWrapper({ className = "w-5 h-5", size, color, strokeWidth, ...rest }) {
          const iconName = String(prop)
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();

          // FontAwesome mapping fallback
          const faMap = {
            "shopping-cart": "cart-shopping",
            "trash": "trash",
            "plus": "plus",
            "minus": "minus",
            "check": "check",
            "x": "xmark",
            "settings": "gear",
            "home": "house",
            "user": "user",
            "users": "users",
            "calendar": "calendar",
            "clock": "clock",
            "search": "magnifying-glass",
            "bell": "bell",
            "bar-chart": "chart-simple",
            "bar-chart-2": "chart-simple",
            "bar-chart-3": "chart-simple",
            "dollar-sign": "dollar-sign",
            "credit-card": "credit-card",
            "database": "database",
            "layers": "layer-group",
            "layout-dashboard": "table-columns",
            "log-out": "right-from-bracket",
            "log-in": "right-to-bracket",
            "chevron-right": "chevron-right",
            "chevron-left": "chevron-left",
            "chevron-down": "chevron-down",
            "chevron-up": "chevron-up",
            "external-link": "arrow-up-right-from-square",
            "shield": "shield-halved",
            "shield-check": "shield",
            "sparkles": "wand-magic-sparkles",
            "package": "box-open",
            "folder": "folder",
            "file": "file",
            "filter": "filter",
            "download": "download",
            "upload": "upload",
            "refresh-cw": "rotate"
          };

          const faClass = faMap[iconName] || iconName;

          return (
            <span 
              className={\`inline-flex items-center justify-center \${className}\`} 
              style={{ fontSize: size ? \`\${size}px\` : undefined, color: color || undefined }}
              {...rest}
            >
              <i className={\`fa-solid fa-\${faClass}\`}></i>
            </span>
          );
        };
      }
    });

    // 3. Sanal React Router DOM Emülatörü
    const RouterContext = createContext({
      currentPath: "${initialRoute}",
      navigate: () => {},
      params: {},
      searchParams: new URLSearchParams()
    });

    function BrowserRouter({ children }) {
      const [currentPath, setCurrentPath] = useState("${initialRoute}");
      const navigate = useCallback((to) => {
        if (typeof to === 'string') {
          setCurrentPath(to);
          window.location.hash = to;
        }
      }, []);

      useEffect(() => {
        const handleHash = () => {
          const hash = window.location.hash.replace(/^#/, '') || '/';
          setCurrentPath(hash);
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
      }, []);

      const value = useMemo(() => ({
        currentPath,
        navigate,
        params: {},
        searchParams: new URLSearchParams()
      }), [currentPath, navigate]);

      return (
        <RouterContext.Provider value={value}>
          {children}
        </RouterContext.Provider>
      );
    }

    function Routes({ children }) {
      const { currentPath } = useContext(RouterContext);
      let match = null;

      React.Children.forEach(children, child => {
        if (!match && React.isValidElement(child)) {
          const { path, element } = child.props;
          if (path === '*' || path === currentPath || (path === '/' && currentPath === '')) {
            match = element;
          }
        }
      });

      return match || <div className="p-8 text-center text-zinc-500">Sayfa bulunamadı ({currentPath})</div>;
    }

    function Route({ path, element }) {
      return null;
    }

    function Link({ to, className, children, ...rest }) {
      const { navigate } = useContext(RouterContext);
      return (
        <a 
          href={\`#\${to}\`} 
          onClick={(e) => { e.preventDefault(); navigate(to); }} 
          className={className} 
          {...rest}
        >
          {children}
        </a>
      );
    }

    function NavLink({ to, className, activeClassName = "bg-zinc-800 text-white", children, ...rest }) {
      const { currentPath, navigate } = useContext(RouterContext);
      const isActive = currentPath === to;
      const computedClass = typeof className === 'function' ? className({ isActive }) : \`\${className || ''} \${isActive ? activeClassName : ''}\`;

      return (
        <a 
          href={\`#\${to}\`} 
          onClick={(e) => { e.preventDefault(); navigate(to); }} 
          className={computedClass} 
          {...rest}
        >
          {children}
        </a>
      );
    }

    function useNavigate() {
      const { navigate } = useContext(RouterContext);
      return navigate;
    }

    function useLocation() {
      const { currentPath } = useContext(RouterContext);
      return { pathname: currentPath, search: '', hash: '' };
    }

    function useParams() {
      const { params } = useContext(RouterContext);
      return params;
    }

    // 4. Sanal In-Memory Supabase Client Emülatörü
    const inMemoryDB = {};
    
    function createClient(url, key) {
      return {
        from: (tableName) => {
          if (!inMemoryDB[tableName]) {
            inMemoryDB[tableName] = [
              { id: "1", title: "Örnek Veri 1", name: "Kullanıcı Örneği", status: "Tamamlandı", created_at: new Date().toISOString() },
              { id: "2", title: "Örnek Veri 2", name: "SaaS Kaydı", status: "Beklemede", created_at: new Date().toISOString() }
            ];
          }

          return {
            select: async (cols = "*") => {
              return { data: inMemoryDB[tableName], error: null };
            },
            insert: async (records) => {
              const items = Array.isArray(records) ? records : [records];
              const withIds = items.map(it => ({ id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString(), ...it }));
              inMemoryDB[tableName].push(...withIds);
              return { data: withIds, error: null };
            },
            update: async (updates) => {
              return { data: updates, error: null };
            },
            delete: async () => {
              return { data: null, error: null };
            }
          };
        },
        auth: {
          getUser: async () => ({ data: { user: { id: "usr_mock_123", email: "demo@minisaas.dev" } }, error: null }),
          signInWithPassword: async () => ({ data: { user: { id: "usr_mock_123" } }, error: null }),
          signOut: async () => ({ error: null })
        }
      };
    }

    // 5. Sanal Require / Modül Yükleyici
    function requireModule(modName) {
      if (modName === 'react') return React;
      if (modName === 'react-dom' || modName === 'react-dom/client') return ReactDOM;
      if (modName === 'lucide-react') return LucideIcons;
      if (modName === 'react-router-dom') return { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, useParams };
      if (modName === '@supabase/supabase-js') return { createClient };
      if (modName === 'clsx' || modName === 'tailwind-merge') return { 
        clsx: (...args) => args.filter(Boolean).join(' '),
        twMerge: (...args) => args.filter(Boolean).join(' ')
      };

      // Sanal dosya araması
      const cleanMod = modName.replace(/^\\.\\//, '').replace(/^\\.\\.\\//, '').replace(/^src\\//, '');
      const candidates = [
        cleanMod,
        \`\${cleanMod}.jsx\`,
        \`\${cleanMod}.tsx\`,
        \`\${cleanMod}.js\`,
        \`\${cleanMod}.ts\`,
        \`\${cleanMod}/index.jsx\`,
        \`\${cleanMod}/index.js\`
      ];

      for (const cand of candidates) {
        if (window.__VFS__[cand]) {
          if (window.__MODULE_CACHE__[cand]) return window.__MODULE_CACHE__[cand];
          
          const rawCode = window.__VFS__[cand];
          const transpiled = transpileModule(rawCode, cand);
          const exports = {};
          const module = { exports };
          
          const moduleFn = new Function(
            'require', 'exports', 'module', 'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'createContext', 'LucideIcons', 'BrowserRouter', 'Routes', 'Route', 'Link', 'NavLink', 'useNavigate', 'useLocation',
            transpiled
          );
          
          moduleFn(
            requireModule, exports, module, React, useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, LucideIcons, BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation
          );

          const result = module.exports.default || module.exports;
          window.__MODULE_CACHE__[cand] = result;
          return result;
        }
      }

      console.warn("Modül çözülemedi:", modName);
      return {};
    }

    // Babel ile JSX ve Import/Export dönüşümü
    function transpileModule(code, path) {
      let transformed = code;

      // 1. ES Import'ları require() çağrılarına çevir
      // import Foo from './Foo' -> const Foo = require('./Foo');
      transformed = transformed.replace(/import\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");');
      
      // import { A, B } from 'lib' -> const { A, B } = require('lib');
      transformed = transformed.replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"]([^'"]+)['"];?/g, 'const { $1 } = require("$2");');

      // import * as X from 'lib' -> const X = require('lib');
      transformed = transformed.replace(/import\\s+\\*\\s+as\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");');

      // 2. Export dönüşümü
      transformed = transformed.replace(/export\\s+default\\s+function\\s+([A-Za-z0-9_]+)/g, 'function $1');
      transformed = transformed.replace(/export\\s+default\\s+([A-Za-z0-9_]+);?/g, 'module.exports.default = $1;');
      transformed = transformed.replace(/export\\s+default\\s+/g, 'module.exports.default = ');
      transformed = transformed.replace(/export\\s+(const|let|var|function|class)\\s+([A-Za-z0-9_]+)/g, '$1 $2; exports.$2 = $2;');

      // 3. Babel Transform
      try {
        const out = Babel.transform(transformed, {
          presets: ['react'],
          filename: path || 'module.jsx'
        }).code;
        return out;
      } catch (err) {
        console.error("Babel Dönüşüm Hatası:", path, err);
        return transformed;
      }
    }

    // 6. Ana Uygulamayı Çalıştırma
    try {
      // Giriş dosyasını tespit et (App.jsx, App.tsx, main.jsx veya ilk component)
      const entryKey = Object.keys(window.__VFS__).find(k => 
        k.endsWith("App.jsx") || k.endsWith("App.tsx") || k.endsWith("Main.jsx") || k.endsWith("App.js")
      ) || Object.keys(window.__VFS__)[0];

      if (!entryKey) {
        throw new Error("Projede çalıştırılabilir bir React bileşeni bulunamadı.");
      }

      const AppExport = requireModule(entryKey);
      const AppComponent = AppExport.default || AppExport;

      if (!AppComponent || typeof AppComponent !== 'function') {
        throw new Error("App bileşeni geçerli bir React fonksiyonu değil.");
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <BrowserRouter>
          <AppComponent />
        </BrowserRouter>
      );
    } catch (runtimeErr) {
      console.error("Sanal Sandbox Başlatma Hatası:", runtimeErr);
      document.getElementById('root').innerHTML = \`
        <div class="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
          <div class="max-w-lg w-full bg-zinc-900 border border-rose-800/40 rounded-2xl p-5 shadow-2xl space-y-3">
            <div class="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Sanal SaaS Çalışma Ortamı Uyarısı</span>
            </div>
            <p class="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              \${runtimeErr.message}
            </p>
            <p class="text-[11px] text-zinc-500">
              Üretilen tüm dosyalar eksiksiz olarak "Proje Dosyaları" sekmesindedir. "ZIP İndir" ile bilgisayarınızda (npm run dev) doğrudan çalıştırabilirsiniz.
            </p>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
}
