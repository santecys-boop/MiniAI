// Virtual In-Browser Module Resolver & Runtime Compiler for Multi-File React SaaS Apps
import { ProjectFile } from "../types";

export interface VirtualSandboxConfig {
  files: ProjectFile[];
  projectName?: string;
  databaseQueries?: string[];
  initialRoute?: string;
}

export function buildVirtualSandboxBundle(config: VirtualSandboxConfig): string {
  const { files, projectName = "Mini SaaS Application", databaseQueries = [] } = config;

  // 1. Eğer tek bir HTML dosyasıysa doğrudan render et
  const indexHtmlFile = files.find(f => f.path.endsWith("index.html") || f.path === "index.html");
  const hasJsxFiles = files.some(f => f.path.endsWith(".jsx") || f.path.endsWith(".tsx") || f.path.endsWith(".js"));

  if (indexHtmlFile && !hasJsxFiles && (indexHtmlFile.content.includes("<!DOCTYPE") || indexHtmlFile.content.includes("<html"))) {
    return indexHtmlFile.content;
  }

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
  
  <!-- Babel Standalone for JSX compilation -->
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
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #18181b; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #71717a; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
  <div id="root">
    <div id="sandbox-loader" class="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <div class="text-xs font-mono text-zinc-400">Mini AI SaaS Ortamı Yükleniyor...</div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        try {
          mountVirtualApp();
        } catch (err) {
          console.error("Mount error:", err);
          renderFallbackError(err.message);
        }
      }, 50);
    });

    function mountVirtualApp() {
      const { 
        useState, useEffect, useReducer, useRef, useMemo, useCallback, 
        createContext, useContext, forwardRef, memo, Fragment 
      } = React;

      // 1. Sanal Dosya Sistemi
      window.__VFS__ = ${filesJson};
      window.__SQL_QUERIES__ = ${sqlJson};
      window.__MODULE_CACHE__ = {};

      // 2. Sanal Lucide İkon Proxy Motoru
      const LucideIcons = new Proxy({}, {
        get: (target, prop) => {
          return function LucideIconWrapper({ className = "w-5 h-5", size, color, strokeWidth, ...rest }) {
            const iconName = String(prop)
              .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
              .toLowerCase();

            const faMap = {
              "shopping-cart": "cart-shopping", "trash": "trash", "plus": "plus", "minus": "minus",
              "check": "check", "x": "xmark", "settings": "gear", "home": "house", "user": "user",
              "users": "users", "calendar": "calendar", "clock": "clock", "search": "magnifying-glass",
              "bell": "bell", "bar-chart": "chart-simple", "bar-chart-2": "chart-simple",
              "bar-chart-3": "chart-simple", "dollar-sign": "dollar-sign", "credit-card": "credit-card",
              "database": "database", "layers": "layer-group", "layout-dashboard": "table-columns",
              "log-out": "right-from-bracket", "log-in": "right-to-bracket", "chevron-right": "chevron-right",
              "chevron-left": "chevron-left", "chevron-down": "chevron-down", "chevron-up": "chevron-up",
              "folder": "folder", "file": "file", "shield": "shield", "sparkles": "wand-magic-sparkles",
              "code": "code", "cpu": "microchip", "terminal": "terminal", "play": "play", "pause": "pause"
            };

            const faClass = faMap[iconName] || "circle";
            return React.createElement('i', {
              className: 'fa-solid fa-' + faClass + ' ' + (className || ''),
              ...rest
            });
          };
        }
      });

      // 3. React Router Emülatörü
      const RouterContext = createContext({
        currentPath: window.location.hash.replace(/^#/, '') || '/',
        navigate: () => {},
        params: {},
        searchParams: new URLSearchParams()
      });

      function BrowserRouter({ children }) {
        const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');

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

        return React.createElement(RouterContext.Provider, { value }, children);
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

        return match || React.createElement('div', { className: 'p-8 text-center text-zinc-500' }, 'Sayfa bulunamadı (' + currentPath + ')');
      }

      function Route({ path, element }) {
        return null;
      }

      function Link({ to, className, children, ...rest }) {
        const { navigate } = useContext(RouterContext);
        return React.createElement('a', {
          href: '#' + to,
          onClick: (e) => { e.preventDefault(); navigate(to); },
          className,
          ...rest
        }, children);
      }

      function NavLink({ to, className, activeClassName = "bg-zinc-800 text-white", children, ...rest }) {
        const { currentPath, navigate } = useContext(RouterContext);
        const isActive = currentPath === to;
        const computedClass = typeof className === 'function' ? className({ isActive }) : ((className || '') + ' ' + (isActive ? activeClassName : ''));

        return React.createElement('a', {
          href: '#' + to,
          onClick: (e) => { e.preventDefault(); navigate(to); },
          className: computedClass,
          ...rest
        }, children);
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

      // 4. Sanal Require / Modül Yükleyici
      function requireModule(modName) {
        if (modName === 'react') return React;
        if (modName === 'react-dom' || modName === 'react-dom/client') return ReactDOM;
        if (modName === 'lucide-react') return LucideIcons;
        if (modName === 'react-router-dom') return { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, useParams };
        if (modName === 'clsx' || modName === 'tailwind-merge') return { 
          clsx: (...args) => args.filter(Boolean).join(' '),
          twMerge: (...args) => args.filter(Boolean).join(' ')
        };

        const cleanMod = modName.replace(/^\\.\\//, '').replace(/^\\.\\.\\//, '').replace(/^src\\//, '');
        const candidates = [
          cleanMod,
          cleanMod + '.jsx', cleanMod + '.tsx', cleanMod + '.js', cleanMod + '.ts',
          cleanMod + '/index.jsx', cleanMod + '/index.js'
        ];

        for (const cand of candidates) {
          if (window.__VFS__[cand]) {
            if (window.__MODULE_CACHE__[cand]) return window.__MODULE_CACHE__[cand];
            
            const rawCode = window.__VFS__[cand];
            const transpiled = transpileModule(rawCode, cand);
            const exports = {};
            const module = { exports };
            
            try {
              const moduleFn = new Function('require', 'exports', 'module', 'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'createContext', 'LucideIcons', 'BrowserRouter', 'Routes', 'Route', 'Link', 'NavLink', 'useNavigate', 'useLocation', transpiled);
              moduleFn(requireModule, exports, module, React, useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, LucideIcons, BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation);
            } catch (execErr) {
              console.warn("Modül çalıştırma hatası:", cand, execErr);
            }

            const result = module.exports.default || module.exports;
            window.__MODULE_CACHE__[cand] = result;
            return result;
          }
        }

        console.warn("Modül bulunamadı:", modName);
        return {};
      }

      function transpileModule(code, path) {
        let transformed = code;
        transformed = transformed.replace(/import\\s+React\\s*,\\s*\\{([^}]+)\\}\\s+from\\s+['"]react['"];?/g, 'var { $1 } = require("react");');
        transformed = transformed.replace(/import\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]([^'"]+)['"];?/g, 'var $1 = require("$2");');
        transformed = transformed.replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"]([^'"]+)['"];?/g, 'var { $1 } = require("$2");');
        transformed = transformed.replace(/import\\s+\\*\\s+as\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]([^'"]+)['"];?/g, 'var $1 = require("$2");');
        transformed = transformed.replace(/export\\s+default\\s+function\\s+([A-Za-z0-9_]+)/g, 'function $1');
        transformed = transformed.replace(/export\\s+default\\s+([A-Za-z0-9_]+);?/g, 'module.exports.default = $1;');
        transformed = transformed.replace(/export\\s+default\\s+/g, 'module.exports.default = ');
        transformed = transformed.replace(/export\\s+(const|let|var|function|class)\\s+([A-Za-z0-9_]+)/g, '$1 $2; exports.$2 = $2;');

        try {
          return Babel.transform(transformed, {
            presets: ['react', 'typescript'],
            filename: path || 'module.tsx'
          }).code;
        } catch (err) {
          console.error("Babel hatası:", path, err);
          return transformed;
        }
      }

      // Giriş dosyasını bul ve render et
      const entryKey = Object.keys(window.__VFS__).find(k => 
        k.endsWith("App.jsx") || k.endsWith("App.tsx") || k.endsWith("Main.jsx") || k.endsWith("App.js")
      ) || Object.keys(window.__VFS__)[0];

      if (!entryKey) {
        throw new Error("Projede çalıştırılabilir bir React bileşeni bulunamadı.");
      }

      const AppExport = requireModule(entryKey);
      const AppComponent = AppExport.default || AppExport;

      if (!AppComponent || (typeof AppComponent !== 'function' && typeof AppComponent !== 'object')) {
        throw new Error("App bileşeni geçerli bir React bileşeni değil.");
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        React.createElement(BrowserRouter, null, React.createElement(AppComponent))
      );
    }

    function renderFallbackError(msg) {
      document.getElementById('root').innerHTML = '<div class="min-h-screen bg-zinc-950 p-6 flex items-center justify-center"><div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-3"><div class="text-amber-400 font-bold text-sm">Mini AI Sanal Önizleme</div><p class="text-xs text-zinc-400 font-mono">' + (msg || 'Yükleniyor...') + '</p><div class="text-[11px] text-zinc-500">Dosyalar "Proje Dosyaları" sekmesinden görüntülenebilir veya ZIP olarak indirilebilir.</div></div></div>';
    }
  </script>
</body>
</html>`;
}
