#!/usr/bin/env python3
"""
Autosave backend for dane.json using only Python stdlib (no external dependencies)
Run: python server_py.py
Then open http://localhost:3000 in your browser

Environment variables:
- EDIT_PASSWORD: Password to edit data (default: changeme)
- EDIT_MODE: 'full' (all views), 'readonly' (no edit) - default: full
- PORT: Port number (default: 8000)
"""
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import sys

DATA_FILE = os.path.join(os.path.dirname(__file__), 'dane.json')
YEAR_FILE = os.path.join(os.path.dirname(__file__), 'year.txt')
PORT = int(os.environ.get('PORT', 8000))
EDIT_TOKEN = os.getenv("EDIT_TOKEN", "changeme")
print("Loaded EDIT_TOKEN:", EDIT_TOKEN)
EDIT_MODE = os.environ.get('EDIT_MODE', 'full')  # full, readonly, json

class AutosaveHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Load current dane.json, serve static files, or return config"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        if path == '/api/data':
            # Handle year request
            if 'action' in query and query['action'][0] == 'getYear':
                try:
                    with open(YEAR_FILE, 'r', encoding='utf-8') as f:
                        year = f.read().strip()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'year': year}).encode('utf-8'))
                except:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'year': 'Year: 1444'}).encode('utf-8'))
            else:
                # Load dane.json
                try:
                    with open(DATA_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode('utf-8'))
                except Exception as e:
                    print(f'Error reading dane.json: {e}')
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Failed to read data'}).encode('utf-8'))
        else:
            # Serve static files
            file_path = self.path
            if file_path == '/':
                file_path = '/index.html'
            
            # Remove leading slash and construct full path
            file_path = file_path.lstrip('/')
            app_dir = os.path.dirname(os.path.abspath(DATA_FILE))
            full_path = os.path.join(app_dir, file_path)
            
            print(f'Requested: {self.path} -> Full path: {full_path} -> Exists: {os.path.isfile(full_path)}')
            
            try:
                if os.path.isfile(full_path):
                    with open(full_path, 'rb') as f:
                        content = f.read()
                    
                    # Determine content type
                    if full_path.endswith('.html'):
                        content_type = 'text/html'
                    elif full_path.endswith('.css'):
                        content_type = 'text/css'
                    elif full_path.endswith('.js'):
                        content_type = 'application/javascript'
                    elif full_path.endswith('.json'):
                        content_type = 'application/json'
                    else:
                        content_type = 'application/octet-stream'
                    
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(content)
                    print(f'✓ Served {full_path}')
                else:
                    print(f'✗ File not found: {full_path}')
                    self.send_response(404)
                    self.send_header('Content-Type', 'text/html')
                    self.end_headers()
                    self.wfile.write(b'<html><body><h1>404 Not Found</h1></body></html>')
            except Exception as e:
                print(f'Error serving file: {e}')
                self.send_response(500)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<html><body><h1>500 Server Error</h1></body></html>')

    def do_POST(self):
        """Autosave updates to dane.json or verify password"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        if path == '/api/data':
            token = self.headers.get('x-api-key', '')
            
            # Check if this is a password verification request
            if 'action' in query and query['action'][0] == 'verify':
                if token == EDIT_TOKEN:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'authorized': True}).encode('utf-8'))
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'authorized': False}).encode('utf-8'))
                return
            
            # Handle year save
            if 'action' in query and query['action'][0] == 'setYear':
                if token != EDIT_TOKEN:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                    return
                
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    body = self.rfile.read(content_length).decode('utf-8')
                    data = json.loads(body)
                    year_text = data.get('year', 'Year: 1444')
                    with open(YEAR_FILE, 'w', encoding='utf-8') as f:
                        f.write(year_text)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                except Exception as e:
                    print(f'Error writing year: {e}')
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return
            
            # Regular data save - check password
            if token != EDIT_TOKEN:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                print(f'[unauthorized] save attempt from {self.client_address[0]}')
                return
            
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                data = json.loads(body)
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f'[autosave] {datetime.now().isoformat()} - dane.json updated')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Data saved'}).encode('utf-8'))
            except Exception as e:
                print(f'Error writing dane.json: {e}')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Failed to save data'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        """Suppress default logging, use custom"""
        pass

if __name__ == '__main__':
    print(f'Data file: {DATA_FILE}')
    print(f'Server running on http://localhost:{PORT}')
    try:
        server = HTTPServer(('0.0.0.0', PORT), AutosaveHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        sys.exit(0)
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)

