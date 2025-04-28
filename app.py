
from flask import Flask, jsonify, render_template
import requests
import urllib3
import logging

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status')
def get_status():
    try:
        url = "https://cactiagregador.telesp.net.br/cacti/statusOlt/statusOlt-202504.txt"
        resp = requests.get(url, verify=False)
        linhas = resp.text.strip().splitlines()
        olts = {}
        for l in linhas:
            partes = l.split(';')
            if len(partes) < 5: continue
            status, data, nome, reboot, modelo = partes
            reboot_value = reboot.split('_')[1].lower() if 'REBOOT_' in reboot else None
            if status == 'DOWN':
                olts[nome] = dict(status='DOWN', data_queda=data, olt=nome,
                                  reboot='', modelo=modelo, normalizado_em='')
            elif status == 'UP' and nome in olts:
                olts[nome].update(status='UP', normalizado_em=data, reboot=reboot_value)
        resultado = sorted(olts.values(), key=lambda x: x['data_queda'], reverse=True)
        return jsonify(resultado)
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
