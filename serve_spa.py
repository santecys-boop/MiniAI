import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = "/root/MiniAI/dist"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        req_path = self.path.split("?")[0].split("#")[0]
        full_path = os.path.join(DIRECTORY, req_path.lstrip("/"))
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.path = "/index.html"
        return super().do_GET()

    def do_HEAD(self):
        req_path = self.path.split("?")[0].split("#")[0]
        full_path = os.path.join(DIRECTORY, req_path.lstrip("/"))
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.path = "/index.html"
        return super().do_HEAD()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
    print(f"🚀 Mini AI Sunucusu Calisiyor: http://localhost:{PORT}")
    httpd.serve_forever()
