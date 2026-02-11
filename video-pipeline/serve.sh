#!/bin/bash
# Serve video-pipeline assets on port 3003
cd /home/bdmorin/nanoclaw/video-pipeline
python3 -c "
import http.server, socketserver
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('0.0.0.0', 3003), 
    type('H', (http.server.SimpleHTTPRequestHandler,), {
        '__init__': lambda self, *a, **k: super(type(self), self).__init__(*a, directory='/home/bdmorin/nanoclaw/video-pipeline', **k),
        'log_message': lambda self, *a: None
    })) as h:
    print('Serving on :3003')
    h.serve_forever()
"
